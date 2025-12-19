
import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { initializeFirebase } from '@/firebase/initializer';
import { doc, updateDoc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Error message: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const userId = session.metadata?.userId;
    if (!userId) {
      console.error('Webhook Error: No userId in session metadata');
      return NextResponse.json({ error: 'No userId in session metadata' }, { status: 400 });
    }

    try {
      // Initialize a server-side firestore instance to update user data
      const { firestore } = initializeFirebase();
      const userDocRef = doc(firestore, 'users', userId);

      // Update the user's subscription tier to 'premium'
      await updateDoc(userDocRef, {
        subscriptionTier: 'premium',
      });
      
      console.log(`Successfully upgraded user ${userId} to premium.`);

    } catch (dbError: any) {
      console.error(`Database update failed for user ${userId}:`, dbError);
      return NextResponse.json({ error: `Database update failed: ${dbError.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
