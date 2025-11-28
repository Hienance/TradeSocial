import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { Tenant } from "@/payload-types";

const createProductSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    description: z.any().optional(),
    price: z.number().min(0, "Price must be positive"),
    category: z.string().min(1, "Category is required"),
    tags: z.array(z.string()).optional(),
    image: z.string().optional(),
    cover: z.string().optional(),
    refundPolicy: z.enum(["30-day", "14-day", "7-day", "1-day", "no-refunds"]).default("30-day"),
    content: z.any().optional(),
    isPrivate: z.boolean().default(false),
});

const updateProductSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Product name is required").optional(),
    description: z.any().optional(),
    price: z.number().min(0, "Price must be positive").optional(),
    category: z.string().optional().nullable(),
    tags: z.array(z.string()).optional(),
    image: z.string().optional().nullable(),
    cover: z.string().optional().nullable(),
    refundPolicy: z.enum(["30-day", "14-day", "7-day", "1-day", "no-refunds"]).optional(),
    content: z.any().optional(),
    isPrivate: z.boolean().optional(),
});

const updateTenantSchema = z.object({
    name: z.string().min(1, "Store name is required").optional(),
    description: z.string().optional().nullable(),
    image: z.string().optional().nullable(),
});

export const profilesRouter = createTRPCRouter({
    // Create a new product
    createProduct: protectedProcedure
        .input(createProductSchema)
        .mutation(async ({ ctx, input }) => {
            const user = ctx.session.user;
            const tenant = user.tenants?.[0]?.tenant as Tenant;

            if (!tenant) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "User does not have a tenant",
                });
            }

            // Check if Stripe details are submitted
            if (!tenant.stripeDetailsSubmitted) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You must verify your Stripe account before adding products",
                });
            }

            const product = await ctx.db.create({
                collection: "products",
                data: {
                    ...input,
                    tenant: tenant.id,
                },
            });

            return product;
        }),

    // Update an existing product
    updateProduct: protectedProcedure
        .input(updateProductSchema)
        .mutation(async ({ ctx, input }) => {
            const { id, ...updateData } = input;

            const updatedProduct = await ctx.db.update({
                collection: "products",
                id,
                data: updateData,
            });

            return updatedProduct;
        }),

    // Archive a product
    archiveProduct: protectedProcedure
        .input(z.object({ id: z.string(), isArchived: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const updatedProduct = await ctx.db.update({
                collection: "products",
                id: input.id,
                data: {
                    isArchived: input.isArchived,
                },
            });

            return updatedProduct;
        }),

    // Toggle product privacy
    toggleProductPrivacy: protectedProcedure
        .input(z.object({ id: z.string(), isPrivate: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const updatedProduct = await ctx.db.update({
                collection: "products",
                id: input.id,
                data: {
                    isPrivate: input.isPrivate,
                },
            });

            return updatedProduct;
        }),

    // Update tenant profile
    updateTenant: protectedProcedure
        .input(updateTenantSchema)
        .mutation(async ({ ctx, input }) => {
            const user = ctx.session.user;
            const tenant = user.tenants?.[0]?.tenant as Tenant;

            if (!tenant) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "User does not have a tenant",
                });
            }

            const updatedTenant = await ctx.db.update({
                collection: "tenants",
                id: tenant.id,
                data: input,
            });

            return updatedTenant;
        }),

    // Get current user's tenant
    getTenant: protectedProcedure.query(async ({ ctx }) => {
        const user = ctx.session.user;
        const tenant = user.tenants?.[0]?.tenant;

        if (!tenant) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "User does not have a tenant",
            });
        }

        const tenantId = typeof tenant === 'string' ? tenant : tenant.id;

        const tenantData = await ctx.db.findByID({
            collection: "tenants",
            id: tenantId,
            depth: 1,
        });

        return tenantData;
    }),

    // Get user's products
    getMyProducts: protectedProcedure
        .input(
            z.object({
                page: z.number().default(1),
                limit: z.number().default(10),
                includeArchived: z.boolean().default(false),
            })
        )
        .query(async ({ ctx, input }) => {
            const user = ctx.session.user;
            const tenant = user.tenants?.[0]?.tenant as Tenant;

            if (!tenant) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "User does not have a tenant",
                });
            }

            const where: any = {
                tenant: {
                    equals: tenant.id,
                },
            };

            if (!input.includeArchived) {
                where.isArchived = {
                    not_equals: true,
                };
            }

            const products = await ctx.db.find({
                collection: "products",
                where,
                page: input.page,
                limit: input.limit,
                depth: 2,
                sort: "-createdAt",
            });

            return products;
        }),
});
