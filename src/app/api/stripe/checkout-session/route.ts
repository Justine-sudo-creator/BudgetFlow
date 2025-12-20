
import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { stripe } from '@/lib/stripe';

const checkoutSchema = z.object({
  userId: z.string(),
});

// =================================================================
// IMPORTANT: Replace this with your actual Stripe Price ID
// =================================================================
// You can find your Price ID in the Stripe Dashboard.
// 1. Go to the "Products" section.
// 2. Click on the product you want to sell (e.g., "Premium Plan").
// 3. In the "Pricing" section, you'll see a Price ID that looks like: price_...
// 4. Copy that ID and paste it here, replacing the placeholder.
// =================================================================
const PREMIUM_PRICE_ID = 'price_1SfyC0J3LMhAU9mdantIW1WZ';

export async function POST(req: NextRequest) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const apiKey = process.env.STRIPE_SECRET_KEY?.trim();

    if (!apiKey) {
      console.error("--- STRIPE CHECKOUT CRITICAL ERROR ---");
      console.error("Stripe Checkout Error: STRIPE_SECRET_KEY is not set or is empty in environment variables.");
      return NextResponse.json({ error: 'Server Configuration Error: Stripe secret key not set.' }, { status: 500 });
    }
    if (!appUrl) {
        console.error("--- STRIPE CHECKOUT CRITICAL ERROR ---");
        console.error("Stripe Checkout Error: NEXT_PUBLIC_APP_URL is not set in environment variables.");
        return NextResponse.json({ error: 'Server Configuration Error: App URL not set.' }, { status: 500 });
    }
    
    if (PREMIUM_PRICE_ID.includes('REPLACE_WITH_YOUR_ACTUAL_PRICE_ID')) {
        console.error("--- STRIPE CHECKOUT CRITICAL ERROR ---");
        console.error("Stripe Checkout Error: PREMIUM_PRICE_ID is not configured.");
        return NextResponse.json(
            { error: 'Stripe is not configured correctly. Missing Price ID.' },
            { status: 500 }
        );
    }
    
    const body = await req.json();
    const { userId } = checkoutSchema.parse(body);
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }
    
    console.log(`--- STRIPE CHECKOUT INITIATED ---`);
    console.log(`User ID: ${userId}`);
    console.log(`App URL: ${appUrl}`);
    console.log(`Using Price ID: ${PREMIUM_PRICE_ID}`);
    
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
    }, {
        apiKey: apiKey
    });

    console.log(`--- STRIPE CHECKOUT SESSION CREATED ---`);
    console.log(`Session ID: ${checkoutSession.id}`);
    return NextResponse.json({ sessionId: checkoutSession.id });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`--- STRIPE CHECKOUT CRITICAL ERROR ---`);
    console.error(`Error: ${errorMessage}`);
    console.error("Full Error Object:", JSON.stringify(error, null, 2));
    
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    return NextResponse.json({ error: `Server Error: ${errorMessage}` }, { status: 500 });
  }
}
