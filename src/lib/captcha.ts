export async function getRecaptchaToken() {

    return new Promise<string | null>(resolve => {
        grecaptcha.ready(async () => {

            const sitekey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

            if (!sitekey) {
                return;
            }

            const token = await grecaptcha.execute(sitekey, { 
                action: 'submit' 
            });

            resolve(token);
        });
    });
}

export async function verifyRecaptchaToken(token: string) {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
        throw new Error("No secret key found");
    }

    const url = new URL("https://www.google.com/recaptcha/api/siteverify");
    url.searchParams.append("secret", secretKey);
    url.searchParams.append("response", token);

    const response = await fetch(url, { method: "POST"});
    const data: CaptchaData = await response.json();

    if (!response.ok) {
        return null;
    }

    return data;
}

type CaptchaData = {
    success: true;
    challenge_ts: string;
    hostname: string;
    score: number;
    action: string;
} |  {
    success: false;
    "error-codes": ErrorCodes[];
}

type ErrorCodes = "missing-input-secret" | "invalid-input-secret" | "missing-input-response" | "invalid-input-response" | "bad-request" | "timeout-or-duplicate";   