
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    // In a real app, you'd want to throw an error, but for the sandbox
    // we'll just log a warning to avoid crashing the server.
    console.warn('STRIPE_SECRET_KEY is not set in the environment variables.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-06-20',
    typescript: true,
});
