import { initTRPC, TRPCError } from '@trpc/server';
import { getPayload } from 'payload';
import { cache } from 'react';
import config from "@payload-config";
import superjson from 'superjson';
import { headers as getHeaders } from 'next/headers';
import { getServerSession } from 'next-auth';
import authOptions from '@/modules/auth/server/auth-options';

export const createTRPCContext = cache(async () => {
  /**
   * @see: https://trpc.io/docs/server/context
   */
  return { userId: 'user_123' };
});
// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure.use(async({ next }) =>{
  const payload = await getPayload({config});

  return next({ctx: {db: payload}});
})

export const protectedProcedure = baseProcedure.use(async({ctx, next}) => {
  const headers = await getHeaders();
  // Primary: Payload auth
  const payloadSession = await ctx.db.auth({ headers });
  let user: any = payloadSession.user;

  // Fallback: NextAuth session (Google OAuth)
  if (!user) {
    const nextAuthSession = await getServerSession(authOptions);
    if (nextAuthSession?.user?.email) {
      // Attempt to map to Payload user by email for unified access control
      const found = await ctx.db.find({
        collection: 'users',
        limit: 1,
        where: { email: { equals: nextAuthSession.user.email } },
      });
      user = found.docs[0];
    }
  }

  if (!user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Must be logged in' });
  }

  // MFA check: if Google MFA enabled ensure recent verification timestamp exists (within 12h)
  if (user.mfaGoogleEnabled) {
    const verifiedAt = user.mfaGoogleVerifiedAt ? new Date(user.mfaGoogleVerifiedAt) : null;
    const twelveHoursMs = 12 * 60 * 60 * 1000;
    const now = Date.now();
    if (!verifiedAt || now - verifiedAt.getTime() > twelveHoursMs) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'MFA Google verification required' });
    }
  }

  // Extract bearer token since AuthResult type does not expose token.
  // Supports 'Authorization: Bearer <token>' or lowercase variant.
  const authHeader = headers.get('authorization') || headers.get('Authorization');
  const payloadToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  return next({
    ctx: {
      ...ctx,
      session: {
        user,
        payloadToken,
      },
    },
  });
});