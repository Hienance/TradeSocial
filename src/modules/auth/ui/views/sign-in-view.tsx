"use client";

import { toast } from "sonner";
import { Poppins } from "next/font/google";
import z from "zod";
import { useForm }  from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { loginSchema } from "../../schemas";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleSignInButton } from "../components/auth-buttons";
import { getRecaptchaToken } from "@/lib/captcha";


const poppins = Poppins({
    subsets: ["latin"],
    weight: ["700"],
});

export  const SignInView = () => {
    const router = useRouter();

    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const login = useMutation(trpc.auth.login.mutationOptions({
        onError: (error) => {
            toast.error(error.message);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries(trpc.auth.session.queryFilter());
            router.push("/");
        }
    }));

    const requestOtp = useMutation(trpc.auth.requestOtp.mutationOptions({
        onError: (error) => toast.error(error.message || "Failed to send code"),
        onSuccess: () => {
            toast.success("Verification code sent to your email");
            setOtpSent(true);
        },
    }));

    const verifyOtp = useMutation(trpc.auth.verifyOtp.mutationOptions({
        onError: (error) => toast.error(error.message || "Invalid or expired code"),
        onSuccess: () => {
            toast.success("Code verified. You can now log in.");
            setOtpVerified(true);
        },
    }));

    const [otpCode, setOtpCode] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);


    const form = useForm<z.infer<typeof loginSchema>>({
        mode: "all",
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const emailValue = form.watch("email");
    const otpRequiredQuery = trpc.auth.isOtpRequired.queryOptions({ email: emailValue || "" });
    const { data: otpRequirement } = useQuery({
        ...otpRequiredQuery,
        enabled: !!emailValue,
    });
    const otpRequired = !!otpRequirement?.required;

    const onSubmit = async (values: z.infer<typeof loginSchema>) => {
        if (otpRequired && !otpVerified) {
            toast.error("Please verify the code sent to your email first");
            return;
        }

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

        login.mutate(values);
    }

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
                            <Link prefetch href="/sign-up">
                                Sign up
                            </Link>
                        </Button>
                    </div>
                    <h1 className="text-4xl font-medium">
                        Welcome back to Trade Social!
                    </h1>
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
                    {otpRequired && (
                    <div className="space-y-4 border rounded-md p-4 bg-white">
                        <p className="text-sm font-medium">Email Verification</p>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                disabled={requestOtp.isPending}
                                onClick={() => {
                                    const email = (form.getValues("email") || "").trim();
                                    if (!email) {
                                        toast.error("Please enter your email first");
                                        return;
                                    }
                                    requestOtp.mutate({ email });
                                }}
                            >
                                {requestOtp.isPending ? "Sending..." : otpSent ? "Resend Code" : "Send Code"}
                            </Button>
                            {otpSent && (
                                <div className="flex-1 flex gap-2">
                                    <Input
                                        placeholder="Enter code"
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value)}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={verifyOtp.isPending || !otpCode}
                                        onClick={() => {
                                            const email = (form.getValues("email") || "").trim();
                                            if (!email) {
                                                toast.error("Please enter your email first");
                                                return;
                                            }
                                            verifyOtp.mutate({ email, code: otpCode });
                                        }}
                                    >
                                        {verifyOtp.isPending ? "Verifying..." : otpVerified ? "Verified" : "Verify"}
                                    </Button>
                                </div>
                            )}
                        </div>
                        {!otpVerified && otpSent && (
                            <p className="text-xs text-muted-foreground">Code expires in 10 minutes.</p>
                        )}
                        {otpVerified && (
                            <p className="text-xs text-green-600">Email verified. Proceed to login.</p>
                        )}
                    </div>
                    )}
                    <Button
                        disabled={login.isPending || (otpRequired && !otpVerified)}
                        type="submit"
                        size="lg"
                        variant="elevated"
                        className="bg-black text-white hover:bg-pink-400 hover:text-primary"
                    >
                        Log in
                    </Button>
                    <p className={cn("text-2xl font-semibold text-center", poppins.className)}>Or</p>
                    <GoogleSignInButton />
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