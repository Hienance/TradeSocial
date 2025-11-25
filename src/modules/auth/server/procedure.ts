import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { headers as getHeaders} from "next/headers";
import { loginSchema, registerSchema } from "../schemas";
import { sanitizeInput } from "@/lib/sanitize";
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
            const safeInput = sanitizeInput(input);
            const existingData = await ctx.db.find({
                collection: "users",
                limit: 1,
                where: {
                    username: {
                        equals: safeInput.username,
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
                    name: safeInput.username,
                    slug: safeInput.username,
                    stripeAccountId: account.id,
                }
            })

            await ctx.db.create({
                collection: "users",
                data: {
                    email: safeInput.email,
                    username: safeInput.username,
                    password: safeInput.password, // this will be hashed
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
                    email: safeInput.email,
                    password: safeInput.password,
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
            const safeInput = sanitizeInput(input);
            const data = await ctx.db.login({
                collection: "users",
                data: {
                    email: safeInput.email,
                    password: safeInput.password,
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