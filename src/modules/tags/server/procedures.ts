import z from "zod";

import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { Where } from "payload";
import { Category } from "@/payload-types";
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
    const data = await ctx.db.find({
        collection: "tags",
        page: input.cursor,
        limit: input.limit,
    });

        return data;
    }),


});