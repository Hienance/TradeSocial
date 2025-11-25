import z from "zod";
import { sanitizeInput } from "@/lib/sanitize";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";


export const reviewsRouter = createTRPCRouter({
    getOne: protectedProcedure
        .input(
            z.object({
                productId: z.string(),
            }),
        )
        .query(async({ctx, input}) => {
    const safeInput = sanitizeInput(input);
    const product = await ctx.db.findByID({
        collection: "products",
        id: safeInput.productId,
    });

    if (!product) {
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
        })
    }

    const reviewData = await ctx.db.find({
        collection: "reviews",
        limit: 1,
        where: {
            and: [
                {                
                    product: {
                        equals: safeInput.productId,
                    },
                },
                {
                    user: {
                        equals: ctx.session.user.id,
                    },
                },
            ],
        },
    });

        const review = reviewData.docs[0];

        if (!review) {
            return null;
        }

        return review;
    }),

    create:protectedProcedure
        .input(
            z.object({
                productId: z.string(),
                rating: z.number().min(1, {message: "Rating is required"}).max(5),
                description: z.string().min(1, {message: "Description is required"}),
            })
        )
        .mutation(async ({input, ctx}) => {
            const safeInput = sanitizeInput(input);
            const product = await ctx.db.findByID({
                collection: "products",
                id: safeInput.productId,
            });

            if (!product) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product not found",
                });
            }

            const existingReviewsData = await ctx.db.find({
                collection: "reviews",
                where: {
                    and: [
                        {
                            product: {
                                equals: safeInput.productId,
                            }
                        },
                        {
                            user: {
                                equals: ctx.session.user.id,
                            },
                        },
                    ],
                },
            });

            if (existingReviewsData.totalDocs > 0) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "You have already reviewed this product",
                });
            }

            const review = await ctx.db.create({
                collection: "reviews",
                data: {
                    user: ctx.session.user.id,
                    product: product.id,
                    rating: safeInput.rating,
                    description: safeInput.description,
                },
            });

            return review;
        }),

    update:protectedProcedure
        .input(
            z.object({
                reviewId: z.string(),
                rating: z.number().min(1, {message: "Rating is required"}).max(5),
                description: z.string().min(1, {message: "Description is required"}),
            })
        )
        .mutation(async ({input, ctx}) => {
            const safeInput = sanitizeInput(input);
            const existingReview = await ctx.db.findByID({
                depth: 0,
                collection: "reviews",
                id: safeInput.reviewId, 
            });

            if (!existingReview) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Review not found",
                });
            }

            if (existingReview.user !== ctx.session.user.id) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not allowed to update this review",
                });
            }
             
            const updatedReview = await ctx.db.update({
                collection: "reviews",
                id: safeInput.reviewId,
                data: { 
                    rating: safeInput.rating,
                    description: safeInput.description,
                },
            });

            return updatedReview;
        }),
});