"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface GoogleButtonProps {
    mode: "signin" | "signup";
    callbackUrl?: string;
}

function GoogleButton({ mode, callbackUrl }: GoogleButtonProps) {
    const [loading, setLoading] = useState(false);
    const label = mode === "signin" ? "Sign in with Google" : "Sign up with Google";

    const handleClick = async () => {
        try {
            setLoading(true);
            await signIn("google", { callbackUrl: callbackUrl || "/" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            type="button"
            onClick={handleClick}
            disabled={loading}
            size="lg"
            variant="outline"
            className="w-full flex items-center gap-3 bg-white text-black hover:bg-slate-100"
        >
            <GoogleIcon className="h-6 w-6" />
            {loading ? "Connecting..." : label}
        </Button>
    );
}

function GoogleIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className={className}
            aria-hidden="true"
        >
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3A12 12 0 1 1 24 12a11.9 11.9 0 0 1 8.4 3.3l5.7-5.7A19.9 19.9 0 0 0 24 4C12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.1-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12a11.9 11.9 0 0 1 8.4 3.3l5.7-5.7A19.9 19.9 0 0 0 24 4C15.3 4 8 9 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.3l-6.3-5.2A12 12 0 0 1 24 36a12 12 0 0 1-11.4-8.2l-6.5 5A20 20 0 0 0 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3A12 12 0 0 1 24 36c-5.2 0-9.6-3.3-11.4-8.2l-6.6 5A20 20 0 0 0 24 44c11.1 0 20-8.9 20-20 0-1.2-.1-2.1-.4-3.5z"/>
        </svg>
    );
}

export function GoogleSignInButton(props: Omit<GoogleButtonProps, "mode">) {
    return <GoogleButton mode="signin" {...props} />;
}

export function GoogleSignUpButton(props: Omit<GoogleButtonProps, "mode">) {
    return <GoogleButton mode="signup" {...props} />;
}
