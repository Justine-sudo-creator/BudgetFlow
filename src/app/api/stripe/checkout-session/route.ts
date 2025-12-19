
import { NextResponse, NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';
import { z } from 'zod';

const checkoutSchema = z.object({
  userId: z.string(),
});

// This is the price ID for your premium plan product in Stripe.
// You need to create a product and a price in your Stripe dashboard.
// For this example, we'll use a placeholder.
// REPALCE THIS with your actual price ID from Stripe.
const PREMIUM_PRICE_ID = 'price_1PREMIUMPLANID'; 

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = checkoutSchema.parse(body);

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const appUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
      throw new Error("Application URL is not configured. Please set NEXT_PUBLIC_APP_URL or ensure VERCEL_URL is available.");
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: PREMIUM_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${appUrl}/budgets?payment=success`,
      cancel_url: `${appUrl}/budgets?payment=cancelled`,
      metadata: {
        userId: userId,
      },
    });

    return NextResponse.json({ sessionId: checkoutSession.id });

  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    // Check for Stripe-specific error structure
    const errorMessage = (error as any).message || 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
