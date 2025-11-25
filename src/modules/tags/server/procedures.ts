import z from "zod";
import { sanitizeInput } from "@/lib/sanitize";

import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { DEFAULT_LIMIT } from "@/constant";


export const tagsRouter = createTRPCRouter({
    getMany: baseProcedure
        .input(
            z.object({
                cursor: z.number().default(1),
                limit: z.number().default(DEFAULT_LIMIT),
            }),
        )
        .query(async({ctx, input}) => {
    const safeInput = sanitizeInput(input);
    const data = await ctx.db.find({
        collection: "tags",
        page: safeInput.cursor,
        limit: safeInput.limit,
    });

        return data;
    }),


});