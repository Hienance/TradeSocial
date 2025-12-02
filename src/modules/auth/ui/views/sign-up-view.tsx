"use client";

import { toast } from "sonner";
import { Poppins } from "next/font/google";
import z from "zod";
import { useForm }  from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { registerSchema } from "../../schemas";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { GoogleSignUpButton } from "../components/auth-buttons";
import { getRecaptchaToken } from "@/lib/captcha";

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["700"],
});

export  const SignUpView = () => {
    const router = useRouter();

    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const register = useMutation(trpc.auth.register.mutationOptions({
        onError: (error) => {
            toast.error(error.message);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries(trpc.auth.session.queryFilter());
            router.push("/");
        }
    }));


    const form = useForm<z.infer<typeof registerSchema>>({
        mode: "all",
        resolver: zodResolver(registerSchema),
        defaultValues: {
            email: "",
            password: "",
            username: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof registerSchema>) => {
        try {
            const token = await getRecaptchaToken();
            if (!token) {
                toast.error("Captcha token not found");
                return;
            }

            const res = await fetch("/api/captcha/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({ message: "Captcha verification failed" }));
                toast.error(data?.message || "Captcha verification failed");
                return;
            }
        } catch (e) {
            toast.error("Captcha verification failed");
            return;
        }

        register.mutate(values);
    }

    const username = form.watch("username");
    const usernameErrors = form.formState.errors.username;

    const showPreview = username && !usernameErrors;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5">
            <div className="bg-[#F4F4F0] h-screen w-full lg:col-span-3 overflow-y-auto">
                <Form {...form}>
                    <form 
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="flex flex-col gap-8 p-4 lg:p-16"
                    > <div className="flex items-center justify-between mb-8">
                        <Link href="/">
                            <span className={cn("text-2xl font-semibold", poppins.className)}>
                                Trade Social
                            </span>
                        </Link>
                        <Button asChild variant="ghost" size="sm" className="text-base border-none underline">
                            <Link prefetch href="/sign-in">
                                Sign in
                            </Link>
                        </Button>
                    </div>
                    <h1 className="text-4xl font-medium">
                        Join us and start selling now on Trade Social!
                    </h1>
                    <FormField
                        name="username"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Username</FormLabel>
                                <FormControl>
                                    <Input {...field}/>
                                </FormControl>
                                <FormDescription className={cn("hidden", showPreview  && "block")}
                                >
                                    Your store will be available at&nbsp;
                                    <strong>{username}</strong>.shop.com
                                </FormDescription>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                     <FormField
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Email</FormLabel>
                                <FormControl>
                                    <Input {...field}/>
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <FormField
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Password</FormLabel>
                                <FormControl>
                                    <Input {...field} type="password"/>
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <Button
                        disabled={register.isPending}
                        type="submit"
                        size="lg"
                        variant="elevated"
                        className="bg-black text-white hover:bg-pink-400 hover:text-primary"
                    >
                        Create Account
                    </Button>
                    <p className={cn("text-2xl font-semibold text-center", poppins.className)}>Or</p>
                    <GoogleSignUpButton/>
                    </form>
                </Form>
            </div>
            <div 
                className="h-screen w-full lg:col-span-2 hidden lg:block"
                style={{
                    backgroundImage: "url('/auth-bg.png')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            />
        </div>
    )
}