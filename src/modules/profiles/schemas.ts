import z from "zod";


export const createProductSchema = z.object({
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

export const updateProductSchema = z.object({
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

export const updateTenantSchema = z.object({
    name: z.string().min(1, "Store name is required").optional(),
    description: z.string().optional().nullable(),
    image: z.string().optional().nullable(),
});