import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { headers as getHeaders} from "next/headers";
import { loginSchema, registerSchema } from "../schemas";
import { generateAuthCookie } from "../utils";
import { stripe } from "@/lib/stripe";
import { writeLog } from "@/lib/logger";
import z from "zod";

export const authRouter = createTRPCRouter({
    session: baseProcedure.query(async({ctx}) => {
        const headers = await getHeaders();

        const session = await ctx.db.auth({headers});

        return session;
    }),
    
    me: protectedProcedure.query(async ({ ctx }) => {
        const user = ctx.session.user;
        if (!user) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "No user in session" });
        }
        return {
            id: user.id,
            email: user.email,
            googleEmail: user.googleEmail,
            googleId: user.googleId,
            emailOtpEnabled: user.emailOtpEnabled,
            mfaGoogleEnabled: user.mfaGoogleEnabled,
            mfaGoogleVerifiedAt: user.mfaGoogleVerifiedAt,
        };
    }),

    toggleGoogleMfa: protectedProcedure
        .input(z.object({ enabled: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const user = ctx.session.user;
            if (!user) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
            }
            if (!user.googleId && !user.googleEmail) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Google account not linked" });
            }
            // Only allow disabling via this endpoint; enabling must go through finalize flow after OAuth re-auth.
            if (input.enabled) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Use finalizeGoogleMfaEnable after Google re-auth to enable MFA" });
            }

            const updated = await ctx.db.update({
                collection: "users",
                id: user.id,
                data: {
                    mfaGoogleEnabled: false,
                    mfaGoogleVerifiedAt: null,
                },
            });

            return {
                mfaGoogleEnabled: updated.mfaGoogleEnabled,
                mfaGoogleVerifiedAt: updated.mfaGoogleVerifiedAt,
            };
        }),

    finalizeGoogleMfaEnable: protectedProcedure.mutation(async ({ ctx }) => {
        const user = ctx.session.user;
        if (!user) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
        }
        if (!user.googleId && !user.googleEmail) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Google account not linked" });
        }
        const updated = await ctx.db.update({
            collection: "users",
            id: user.id,
            data: {
                mfaGoogleEnabled: true,
                mfaGoogleVerifiedAt: new Date().toISOString(),
            },
        });
        return {
            mfaGoogleEnabled: updated.mfaGoogleEnabled,
            mfaGoogleVerifiedAt: updated.mfaGoogleVerifiedAt,
        };
    }),

    register: baseProcedure
        .input(registerSchema).mutation(async({input, ctx}) => {
            const existingData = await ctx.db.find({
                collection: "users",
                limit: 1,
                where: {
                    username: {
                        equals: input.username,
                    },
                },
            });

            const existingUser = existingData.docs[0];

            if (existingUser) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Username already taken",
                })
            }
            
            const account = await stripe.accounts.create({});

            if (!account) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Failed to create Stripe account",
                }); 
            }

            const tenant = await ctx.db.create({
                collection: "tenants",
                data: {
                    name: input.username,
                    slug: input.username,
                    stripeAccountId: account.id,
                }
            })

            await ctx.db.create({
                collection: "users",
                data: {
                    email: input.email,
                    username: input.username,
                    password: input.password, // this will be hashed
                    tenants: [ 
                        {
                            tenant: tenant.id,
                        },
                    ],
                },
            });

            const data = await ctx.db.login({
                collection: "users",
                data: {
                    email: input.email,
                    password: input.password,
                },
            });

            if (!data.token) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "failed to login",
                });
            }
            const createdUser = await ctx.db.find({ collection: 'users', limit: 1, where: { email: { equals: input.email } } });
            const u = createdUser.docs[0];
            if (u) {
              await writeLog({ type: 'sign-up', userId: u.id, email: input.email });
            }
        }),

    login: baseProcedure
        .input(loginSchema).mutation(async({input, ctx}) => {
            const data = await ctx.db.login({
                collection: "users",
                data: {
                    email: input.email,
                    password: input.password,
                },
            });

            if (!data.token) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "failed to login",
                });
            }
            await generateAuthCookie ({
                prefix: ctx.db.config.cookiePrefix,
                value: data.token,
            });

                        // Log sign-in
            const found = await ctx.db.find({ collection: 'users', limit: 1, where: { email: { equals: input.email } }});
            const user = found.docs[0];
            if (user) {
                await writeLog({ type: 'sign-in', userId: user.id, email: input.email });
            }
            return data;
        }),
    
    logout: baseProcedure
        .mutation(async ({ ctx }) => {
            await generateAuthCookie({
                prefix: ctx.db.config.cookiePrefix,
                value: "", 
            });

            try {
                const headers = await getHeaders();
                const session = await ctx.db.auth({ headers });
                if (session?.user?.id) {
                await writeLog({ type: 'sign-out', userId: session.user.id });
                }
            } catch {}
            return true;
        }),

    requestOtp: baseProcedure
        .input(z.object({ email: z.string().email() }))
        .mutation(async ({ ctx, input }) => {
            const found = await ctx.db.find({
                collection: "users",
                limit: 1,
                where: { email: { equals: input.email } },
            });
            const user = found.docs[0];
            if (!user) {
                throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
            }
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

            await ctx.db.update({
                collection: "users",
                id: user.id,
                data: { otpCode: code, otpExpiresAt: expiresAt },
            });

            const to = input.email || user.googleEmail
            try {
                await (ctx.db as any).sendEmail?.({
                    to,
                    subject: "Your TradeSocial verification code",
                    html: `<p>Your login verification code is <strong>${code}</strong>. It expires in 10 minutes.</p>`,
                });
            } catch (err) {
                console.log("OTP code (dev):", code, "to:", to);
            }
            return { ok: true };
        }),

    verifyOtp: baseProcedure
        .input(z.object({ email: z.string().email(), code: z.string().min(4).max(10) }))
        .mutation(async ({ ctx, input }) => {
            const found = await ctx.db.find({
                collection: "users",
                limit: 1,
                where: { email: { equals: input.email } },
            });
            const user = found.docs[0] as any;
            if (!user) {
                throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
            }
            if (!user.otpCode || !user.otpExpiresAt) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "No active OTP request" });
            }
            const expired = Date.now() > new Date(user.otpExpiresAt).getTime();
            if (expired) {
                await ctx.db.update({ collection: "users", id: user.id, data: { otpCode: null, otpExpiresAt: null } });
                throw new TRPCError({ code: "BAD_REQUEST", message: "OTP expired" });
            }
            if (user.otpCode !== input.code) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid code" });
            }
            await ctx.db.update({ collection: "users", id: user.id, data: { otpCode: null, otpExpiresAt: null } });
            return { ok: true };
        }),

    toggleEmailOtp: protectedProcedure
        .input(z.object({ enabled: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const user = ctx.session.user;
            if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
            const updated = await ctx.db.update({
                collection: "users",
                id: user.id,
                data: { emailOtpEnabled: input.enabled },
            });
            return { emailOtpEnabled: (updated as any).emailOtpEnabled === true };
        }),

    isOtpRequired: baseProcedure
        .input(z.object({ email: z.string().email() }))
        .query(async ({ ctx, input }) => {
            const found = await ctx.db.find({
                collection: "users",
                limit: 1,
                where: { email: { equals: input.email } },
            });
            const u = found.docs[0] as any;
            return { required: !!u?.emailOtpEnabled };
        }),
});