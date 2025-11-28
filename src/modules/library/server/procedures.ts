import z from "zod";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { Media, Tenant } from "@/payload-types";
import { DEFAULT_LIMIT } from "@/constant";
import { TRPCError } from "@trpc/server";


export const libraryRouter = createTRPCRouter({
    getOne: protectedProcedure
        .input(
            z.object({
                productId: z.string(),
            }),
        )
        .query(async({ctx, input}) => {
            const ordersData = await ctx.db.find({
                collection: "orders",
                pagination: false,
                limit: 1,
                where: {
                    and: [
                        {
                            product: {
                                equals: input.productId,
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

            const order = ordersData.docs[0];

            if (!order) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Order not found",
                });
            }

            const product = await ctx.db.findByID ({
                collection: "products",
                id: input.productId,
            });

            if (!product) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product not found",
                });
            }

            
            const reviews = await ctx.db.find({
                collection: "reviews",
                pagination: false,
                where: {
                    product: {
                        equals: input.productId,
                    },
                },
            });

            const reviewRating = reviews.docs.length > 0 ? Math.round((reviews.docs.reduce((acc, review) => acc + review.rating, 0) / reviews.totalDocs)*100)/100 : 0;

            const ratingDistribution: Record<number,number> = {
                5:0,
                4:0,
                3:0,
                2:0,
                1:0,
            };

            if (reviews.totalDocs > 0) {
                reviews.docs.forEach((review) => {
                    const rating = review.rating;

                    if (rating >= 1 && rating <= 5) {
                        ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
                    }
                });
                
                Object.keys(ratingDistribution).forEach((key) => {
                    const rating =  Number(key);
                    const count = ratingDistribution[rating] || 0;
                    ratingDistribution[rating] = Math.round(
                        (count / reviews.totalDocs) * 100, 
                    );
                });
            }

            return {
                ...product,
                image: product.image as Media | null,
                cover: product.cover as Media | null,
                tenant: product.tenant as Tenant & {image: Media | null},
                reviewRating,
                reviewCount : reviews.totalDocs,
                ratingDistribution,
            }
    }),

    getMany: protectedProcedure
        .input(
            z.object({
                cursor: z.number().default(1),
                limit: z.number().default(DEFAULT_LIMIT),
            }),
        )
        .query(async({ctx, input}) => {
            const data = await ctx.db.find({
                collection: "orders",
                depth: 0,
                page: input.cursor,
                limit: input.limit,
                where: {
                    user: {
                        equals: ctx.session.user.id,
                    },
                },
            }); 

            const productIds = data.docs.map((order) => order.product);

            const productsData = await ctx.db.find ({
                collection: "products",
                pagination: false,
                where: {
                    id: {
                        in: productIds,
                    },
                },
            });

            const dataWithSummarizedReviews = await Promise.all(
                productsData.docs.map(async(doc)=> {
                    const reviewsData = await ctx.db.find({
                        collection: "reviews",
                        pagination: false,
                        where: {
                            product: {
                                equals: doc.id,
                            },
                        },
                    });

                    return {
                        ...doc,
                        reviewCount: reviewsData.totalDocs,
                        reviewRating: reviewsData.docs.length === 0 ? 0 : Math.round((reviewsData.docs.reduce((acc, review) => acc + review.rating, 0) / reviewsData.totalDocs)*100)/100
                    }
                })
            )

            return {
                ...productsData,
                docs: dataWithSummarizedReviews.map((doc) => ({
                    ...doc,
                    image: doc.image as Media | null,
                    tenant: doc.tenant as Tenant & {image: Media | null},
                }))
            };
    }),
});