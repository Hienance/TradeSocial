import 'server-only';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';
import { TRPCError } from '@trpc/server';
import { authenticator } from 'otplib';
import { z } from 'zod';
async function getCurrentUser(ctx: any) {
  const sessionUser = ctx.session.user as any;
  let user: any = null;
  if (sessionUser?.id) {
    try {
      user = await ctx.db.findByID({ collection: 'users', id: sessionUser.id });
    } catch {}
  }
  if (!user && sessionUser?.email) {
    const found = await ctx.db.find({
      collection: 'users',
      limit: 1,
      where: { email: { equals: sessionUser.email } },
    });
    user = found.docs[0];
  }
  if (!user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not found for session' });
  }
  return user;
}

// Generate a new secret and corresponding otpauth URL for QR code display
function generateTotpSecret(email: string) {
  const secret = authenticator.generateSecret();
  const label = email || 'user';
  const issuer = 'TradeSocial';
  const otpauth = authenticator.keyuri(label, issuer, secret);
  return { secret, otpauth };
}

export const mfaTotpRouter = createTRPCRouter({
  status: protectedProcedure.query(async ({ ctx }) => {
    const user = await getCurrentUser(ctx);
    return {
      enabled: !!user.totpEnabled,
      lastVerified: user.totpVerifiedAt || null,
    };
  }),
  enroll: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await getCurrentUser(ctx);
    if (user.totpEnabled) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'TOTP already enabled' });
    }
    const { secret, otpauth } = generateTotpSecret(user.email);
    // Persist secret but keep totpEnabled false until verification
    await ctx.db.update({
      collection: 'users',
      id: user.id,
      data: { totpSecret: secret, totpEnabled: false, totpVerifiedAt: null } as any,
      overrideAccess: true,
    });
    // Verify persistence immediately to avoid stale session issues
    const check = await ctx.db.findByID({ collection: 'users', id: user.id });
    const saved = !!(check as any)?.totpSecret;
    if (!saved) {
      console.error('[TOTP] Secret not persisted after enroll', { userId: user.id });
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to persist TOTP secret. Please reload and try again.' });
    }
    return { otpauth, secret, saved } as any; // secret returned for manual entry (do not log in production)
  }),
  verify: protectedProcedure
    .input(z.object({ code: z.string().min(6).max(10) }))
    .mutation(async ({ ctx, input }) => {
      const user = await getCurrentUser(ctx);
      if (!user.totpSecret) {
        console.error('[TOTP] Missing totpSecret at verify', { userId: user.id });
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No TOTP enrollment in progress' });
      }
      const token = input.code.replace(/\s+/g, '').trim();
      if (!/^\d{6,10}$/.test(token)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Code format invalid' });
      }
      // Allow clock skew: accept previous/current/next slices
      authenticator.options = { window: 2 } as any;
      const isValid = authenticator.check(token, user.totpSecret);
      if (!isValid) {
        console.warn('[TOTP] Verification failed', { userId: user.id, tokenLength: token.length });
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid or expired TOTP code' });
      }
      await ctx.db.update({
        collection: 'users',
        id: user.id,
        data: { totpEnabled: true, totpVerifiedAt: new Date().toISOString() } as any,
        overrideAccess: true,
      });
      return { success: true };
    }),
  disable: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await getCurrentUser(ctx);
    if (!user.totpEnabled) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'TOTP not enabled' });
    }
    await ctx.db.update({
      collection: 'users',
      id: user.id,
      data: { totpEnabled: false, totpSecret: null, totpVerifiedAt: null } as any,
      overrideAccess: true,
    });
    return { success: true };
  }),
  challenge: protectedProcedure
    .input(z.object({ code: z.string().min(6).max(10) }))
    .mutation(async ({ ctx, input }) => {
      const user = await getCurrentUser(ctx);
      if (!user.totpEnabled || !user.totpSecret) {
        console.error('[TOTP] Challenge rejected — enabled/secret missing', { userId: user.id, enabled: !!user.totpEnabled });
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'TOTP not enabled' });
      }
      const token = input.code.replace(/\s+/g, '').trim();
      if (!/^\d{6,10}$/.test(token)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Code format invalid' });
      }
      authenticator.options = { window: 2 } as any;
      const isValid = authenticator.check(token, user.totpSecret);
      if (!isValid) {
        console.warn('[TOTP] Challenge failed', { userId: user.id });
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid or expired TOTP code' });
      }
      await ctx.db.update({
        collection: 'users',
        id: user.id,
        data: { totpVerifiedAt: new Date().toISOString() } as any,
        overrideAccess: true,
      });
      return { success: true };
    }),
  debug: protectedProcedure.query(async ({ ctx }) => {
    const user = await getCurrentUser(ctx);
    const raw = await ctx.db.find({ collection: 'users', limit: 1, depth: 0, where: { id: { equals: user.id } } });
    const doc: any = raw.docs[0] || {};
    return {
      userId: user.id,
      enabled: !!doc.totpEnabled,
      hasSecret: !!doc.totpSecret,
      secretPreview: doc.totpSecret ? String(doc.totpSecret).slice(0,4)+'...' : null,
    };
  }),
});

export type MfaTotpRouter = typeof mfaTotpRouter;