import 'server-only';
import type { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getPayload } from 'payload';
import config from '@payload-config';
import { stripe } from '@/lib/stripe';
import { generateAuthCookie } from '../utils';

// Helper to ensure we have a username that meets existing pattern constraints
function deriveUsername(base: string): string {
  const cleaned = base.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-');
  const trimmed = cleaned.replace(/^-+/, '').replace(/-+$/, '');
  return trimmed.length ? trimmed : `user-${Date.now()}`;
}

export const authOptions: AuthOptions = {
  providers: [
    (() => {
      const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
      if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        console.error('[Google OAuth] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET at init');
        // Provide dummy provider to prevent runtime crash but sign-in will fail gracefully
        return GoogleProvider({ clientId: 'missing', clientSecret: 'missing' });
      }
      return GoogleProvider({
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true,
      });
    })(),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ profile }) {
      if (!profile || !profile.email) return false;
      // Environment validation to avoid opaque OAuthSignin errors
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.error('[Google OAuth] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
        return false;
      }
      try {
        const payload = await getPayload({ config });
        const existing = await payload.find({
          collection: 'users',
          limit: 1,
          where: { email: { equals: profile.email } },
        });
        let userDoc: any = existing.docs[0];
        // Helper to ensure unique tenant slug
        const ensureUniqueTenantSlug = async (base: string) => {
          let attempt = base;
          let suffix = 1;
          while (true) {
            const existingTenant = await payload.find({
              collection: 'tenants',
              limit: 1,
              where: { slug: { equals: attempt } },
            });
            if (!existingTenant.docs[0]) return attempt;
            attempt = `${base}-${suffix++}`;
          }
        };

        const createTenantForUser = async (username: string, userId?: string) => {
          // Create Stripe account
            const account = await stripe.accounts.create({});
            const slug = await ensureUniqueTenantSlug(username);
            const tenant = await payload.create({
              collection: 'tenants',
              data: {
                name: username,
                slug,
                stripeAccountId: account.id,
              },
            });
            if (userId) {
              await payload.update({
                collection: 'users',
                id: userId,
                data: {
                  tenants: [ { tenant: tenant.id } ],
                } as any,
              });
            }
            return tenant;
        }

        if (!userDoc) {
          const usernameSource = (profile.name && typeof profile.name === 'string'
            ? profile.name
            : profile.email.split('@')[0]) as string;
          const username = deriveUsername(usernameSource).slice(0, 63);
          // Create tenant first so we can attach during user creation
          const account = await stripe.accounts.create({});
          const slug = await ensureUniqueTenantSlug(username);
          const tenant = await payload.create({
            collection: 'tenants',
            data: {
              name: username,
              slug,
              stripeAccountId: account.id,
            },
          });
          const deterministicPassword = `google-${(profile as any).sub}`;
          userDoc = await payload.create({
            collection: 'users',
            data: {
              email: profile.email,
              username,
              password: deterministicPassword,
              googleId: (profile as any).sub,
              googleEmail: profile.email,
              mfaGoogleVerifiedAt: new Date().toISOString(),
              tenants: [ { tenant: tenant.id } ],
            } as any,
          });
          // Immediately perform Payload login to obtain token & set auth cookie
          try {
            const loginData = await payload.login({
              collection: 'users',
              data: { email: profile.email, password: deterministicPassword },
            });
            if (loginData?.token) {
              await generateAuthCookie({
                prefix: payload.config.cookiePrefix,
                value: loginData.token,
              });
            } else {
              console.warn('[Google OAuth] Payload login did not return token for newly created user');
            }
          } catch (loginErr) {
            console.error('[Google OAuth] Failed immediate Payload login:', loginErr);
          }
        } else {
          const hasGoogle = !!(userDoc as any).googleId && !!(userDoc as any).googleEmail;
          if (!hasGoogle) {
            await payload.update({
              collection: 'users',
              id: userDoc.id,
              data: {
                googleId: (userDoc as any).googleId || (profile as any).sub,
                googleEmail: (userDoc as any).googleEmail || profile.email,
              } as any,
            });
          }
          // Ensure tenant exists
          const tenantArray = (userDoc as any).tenants || [];
          if (!tenantArray.length) {
            const fallbackEmailPart = (profile.email || '').split('@')[0] || `user${Date.now()}`;
            const username = (userDoc as any).username || deriveUsername(fallbackEmailPart).slice(0,63);
            await createTenantForUser(username, userDoc.id);
          }
          // Attempt immediate Payload login for existing user as well
          try {
            const deterministicPassword = `google-${(profile as any).sub}`;
            let loginData = await payload.login({
              collection: 'users',
              data: { email: profile.email, password: deterministicPassword },
            });
            if (!loginData?.token) {
              // If deterministic password isn't set yet, set it and retry
              await payload.update({
                collection: 'users',
                id: userDoc.id,
                data: { password: deterministicPassword } as any,
              });
              loginData = await payload.login({
                collection: 'users',
                data: { email: profile.email, password: deterministicPassword },
              });
            }
            if (loginData?.token) {
              await generateAuthCookie({
                prefix: payload.config.cookiePrefix,
                value: loginData.token,
              });
            } else {
              console.warn('[Google OAuth] Existing user login did not return token');
            }
          } catch (err) {
            console.error('[Google OAuth] Existing user Payload login failed:', err);
          }
          // If MFA via Google is enabled, refresh verification timestamp
          if ((userDoc as any).mfaGoogleEnabled) {
            await payload.update({
              collection: 'users',
              id: userDoc.id,
              data: {
                mfaGoogleVerifiedAt: new Date().toISOString(),
              } as any,
            });
          }
        }
        return true;
      } catch (err) {
        console.error('[Google OAuth] signIn callback error:', err);
        return false;
      }
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.googleSub = (profile as any).sub;
        token.email = profile.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).googleSub = token.googleSub as string | undefined;
      }
      return session;
    },
  },
};

export default authOptions;
