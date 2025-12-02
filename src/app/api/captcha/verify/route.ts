import { NextResponse } from "next/server";
import { verifyRecaptchaToken } from "@/lib/captcha";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ success: false, message: "Token not found" }, { status: 400 });
    }

    const captchaData = await verifyRecaptchaToken(token);
    if (!captchaData) {
      return NextResponse.json({ success: false, message: "Captcha verification failed" }, { status: 400 });
    }

    if (!captchaData.success || ("score" in captchaData && captchaData.score < 0.5)) {
      return NextResponse.json({
        success: false,
        message: "Captcha verification failed",
        errors: !captchaData.success ? ("error-codes" in captchaData ? captchaData["error-codes"] : null) : null,
      }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Token verified" });
  } catch (err) {
    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
  }
}
