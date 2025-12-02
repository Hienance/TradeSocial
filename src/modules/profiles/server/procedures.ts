import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { Tenant } from "@/payload-types";
import { createProductSchema, updateProductSchema, updateTenantSchema } from "../schemas";


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

            // Build update payload. Only set image when provided.
            const data: Record<string, unknown> = {};
            if (typeof input.name !== 'undefined') data.name = input.name;
            if (typeof input.description !== 'undefined') data.description = input.description;
            if (typeof input.image === 'string') data.image = input.image; // set to provided media ID
            if (input.image === null) data.image = null; // allow clearing image

            const updatedTenant = await ctx.db.update({
                collection: "tenants",
                id: tenant.id,
                data,
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


    getMyProducts: protectedProcedure
        .input(
            z.object({
                page: z.number().default(1),
                limit: z.number().default(10),
                includeArchived: z.boolean().default(false),
                search: z.string().nullable().optional(),
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

            if (input.search) {
                where.name = {
                    like: input.search,
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

    // Stats for dashboard: counts without fetching all docs
    getMyProductStats: protectedProcedure
        .query(async ({ ctx }) => {
            const user = ctx.session.user;
            const tenant = user.tenants?.[0]?.tenant as Tenant;

            if (!tenant) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "User does not have a tenant",
                });
            }

            const activeWhere: any = {
                tenant: { equals: tenant.id },
                isArchived: { not_equals: true },
            };

            const privateActiveWhere: any = {
                tenant: { equals: tenant.id },
                isArchived: { not_equals: true },
                isPrivate: { equals: true },
            };

            const [activeRes, privateRes] = await Promise.all([
                ctx.db.find({ collection: "products", where: activeWhere, page: 1, limit: 1, depth: 0 }),
                ctx.db.find({ collection: "products", where: privateActiveWhere, page: 1, limit: 1, depth: 0 }),
            ]);

            return {
                totalActive: activeRes.totalDocs,
                totalPrivateActive: privateRes.totalDocs,
            };
        }),
});
