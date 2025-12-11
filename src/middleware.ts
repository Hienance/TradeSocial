import { NextRequest, NextResponse } from "next/server";

export const config = {
    matcher: [
        "/((?!api/|_next/|_static/|_vercel|media/|[\w-]+\.\w+).*)"
    ]
}

export default async function middleware(req: NextRequest) {
    const url = req.nextUrl;
    // extract hostname
    const hostname = req.headers.get("host") || "";

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "";  

    if (hostname.endsWith(`.${rootDomain}`)) {
        const tenantSlug = hostname.replace(`.${rootDomain}`, "");
        const res = NextResponse.rewrite(new URL(`/tenants/${tenantSlug}${url.pathname}`, req.url));
        // Apply security headers
        applySecurityHeaders(res, req);
        return res;
    }

    const res = NextResponse.next();
    applySecurityHeaders(res, req);
    return res;
};

function applySecurityHeaders(res: NextResponse, req: NextRequest) {
    // Strict-Transport-Security (HSTS): 1 year, include subdomains, preload
    res.headers.set(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload"
    );

    // Anti-clickjacking: block framing
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("Frame-Options", "DENY"); // legacy fall-back if scanners check it

    // Basic hardening
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // Content-Security-Policy: permissive enough to avoid login breakage while providing protection
    // Adjust as needed if you add new external resources.
    const csp = [
        "default-src 'self'",
        "base-uri 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
        "style-src 'self' 'unsafe-inline' https:",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data: https:",
        "connect-src 'self' https: wss:",
        "frame-src 'self' https:",
        "frame-ancestors 'none'",
        "form-action 'self' https:",
        "object-src 'none'",
    ].join("; ");

    res.headers.set("Content-Security-Policy", csp);
}