
import Stripe from 'stripe';

// This is the correct way to initialize the Stripe client.
// It will read the environment variable at runtime.
// The exclamation mark tells TypeScript that we are sure this variable will be present.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20',
    typescript: true,
});
