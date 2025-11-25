import z from "zod";
import { sanitizeInput } from "@/lib/sanitize";

import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { Tenant, Media } from "@/payload-types";
import { TRPCError } from "@trpc/server";


export const tenantsRouter = createTRPCRouter({
    getOne: baseProcedure
        .input(
            z.object({
                slug: z.string(),  
            }),
        )
        .query(async({ctx, input}) => {
    const safeInput = sanitizeInput(input);
    const tenantsData = await ctx.db.find({
        collection: "tenants",
        where: {
            slug: {
                equals: safeInput.slug,
            },
        },
        limit: 1,
        pagination: false,
    });

    const tenant = tenantsData.docs[0];

    if (!tenant) {
        throw new TRPCError ({code: "NOT_FOUND", message: "Tenant not found"});
    }

        return tenant as Tenant & { image: Media | null};
    }),


});