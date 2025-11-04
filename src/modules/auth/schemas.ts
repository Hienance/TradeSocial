import z from "zod";

export const loginSchema =         
    z.object({
    email:z.string().email(),
    password: z.string(), // parse password here
    });


export const registerSchema =      
    z.object({
    email:z.string().email(),
    password: z.string().min(3), // parse password here
    username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(63, "Username must be be less than 63 characters" )
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "Username can only contain lowercase letters, numbers and hyphens. It must start and end with a letter or a number.")
    .refine((val) => !val.includes("--"),"Username cannot contain consecutive hyphens")
    .transform((val) => val.toLowerCase()), //[username.shop.com]
    });