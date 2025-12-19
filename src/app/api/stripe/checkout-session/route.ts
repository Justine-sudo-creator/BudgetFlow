
import { NextResponse, NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';
import { z } from 'zod';

const checkoutSchema = z.object({
  userId: z.string(),
});

// =================================================================
// IMPORTANT: Replace this with your actual Stripe Price ID
// =================================================================
// You can find your Price ID in the Stripe Dashboard.
// 1. Go to the "Products" section.
// 2. Click on the product you want to sell (e.g., "Premium Plan").
// 3. In the "Pricing" section, you'll see a Price ID that looks like: price_1P...
// 4. Copy that ID and paste it here, replacing the placeholder.
// =================================================================
const PREMIUM_PRICE_ID = 'price_1SfyC0J3LMhAU9mdantIW1WZ'; 

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = checkoutSchema.parse(body);

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    // Dynamically construct the application URL from request headers
    const headers = req.headers;
    const protocol = headers.get('x-forwarded-proto') || 'http';
    // Use x-forwarded-host on Vercel, fallback to host header
    const host = headers.get('x-forwarded-host') || headers.get('host') || 'localhost:3000';
    const appUrl = `${protocol}://${host}`;


    if (!appUrl) {
      throw new Error("Application URL could not be determined.");
    }
    
    // Check if the placeholder Price ID is still being used.
    if (PREMIUM_PRICE_ID.includes('REPLACE_WITH_YOUR_ACTUAL_PRICE_ID')) {
        console.error("Stripe Price ID has not been replaced. Please update it in the code.");
        return NextResponse.json(
            { error: 'Stripe is not configured correctly. Missing Price ID.' },
            { status: 500 }
        );
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
