"use server";

import { verifyRecaptchaToken } from "@/lib/captcha";

export async function submitAction(
    token: string | null,
) {
    if (!token) {
        return {
            success: false,
            message: "Token not found"
        };
    }

    const captchaData = await verifyRecaptchaToken(token);

    if (!captchaData) {
        return {
            success: false,
            message: "Captcha verification failed"
        };
    }

    if (!captchaData.success || captchaData.score < 0.5) {
        return {
            success: false,
            message: "Captcha verification failed",
            errors: !captchaData.success ? captchaData["error-codes"] : null,
        };
    }

    return {
        success: true,
        message: "Token verified"
    }
}
