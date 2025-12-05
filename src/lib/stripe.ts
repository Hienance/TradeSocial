import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

if (!key || key.trim().length === 0) {
    throw new Error("Stripe: STRIPE_SECRET_KEY is missing. Set it in your environment (e.g., .env.local) before starting the app.");
}

export const stripe = new Stripe(key, {
    // Use a valid API version; update if needed
    apiVersion: "2025-08-27.basil",
    typescript: true,
});