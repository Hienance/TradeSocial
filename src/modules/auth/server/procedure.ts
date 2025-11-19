import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { headers as getHeaders} from "next/headers";
import { loginSchema, registerSchema } from "../schemas";
import { generateAuthCookie } from "../utils";
import { stripe } from "@/lib/stripe";

export const authRouter = createTRPCRouter({
    session: baseProcedure.query(async({ctx}) => {
        const headers = await getHeaders();

        const session = await ctx.db.auth({headers});

        return session;
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

            // create stripe account (wrap in try/catch to handle network/proxy errors)
            let account: any;
            try {
                account = await stripe.accounts.create({});
            } catch (err: any) {
                console.error("Stripe account creation failed:", err);
                // In local development allow a fallback so dev flow isn't blocked
                if (process.env.NODE_ENV === "development") {
                    account = { id: "test" };
                } else {
                    throw new TRPCError({
                        code: "SERVICE_UNAVAILABLE",
                        message:
                            "Failed to connect to Stripe. Check network/firewall/proxy and verify STRIPE_SECRET_KEY is correct.",
                    });
                }
            }

            if (!account?.id) {
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

            return data;
        }),
    
    logout: baseProcedure
        .mutation(async ({ ctx }) => {
            await generateAuthCookie({
                prefix: ctx.db.config.cookiePrefix,
                value: "", // clear cookie value
            });

            return true;
        }),
});