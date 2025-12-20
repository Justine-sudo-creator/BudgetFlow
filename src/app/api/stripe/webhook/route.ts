
import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import * as admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';

// Initialize Firebase Admin SDK
// This must be done once at the top level.
if (admin.apps.length === 0) {
  // Ensure all required environment variables are present before initializing.
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('CRITICAL: Missing one or more required Firebase Admin SDK environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).');
    // We can't throw here at the top level, but the app will fail later if it's not initialized.
  } else {
    try {
      const serviceAccount: ServiceAccount = {
        projectId,
        clientEmail,
        // The private key must be properly formatted. Vercel escapes newlines.
        privateKey: privateKey.replace(/\\n/g, '\n'),
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin SDK initialized successfully.");
    } catch (error: any) {
      console.error('CRITICAL: Firebase Admin SDK initialization failed.', error.message);
    }
  }
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Webhook Error: STRIPE_WEBHOOK_SECRET is not set.');
    return NextResponse.json({ error: 'Server configuration error: Webhook secret not set.' }, { status: 500 });
  }

  // Stripe requires the raw body to construct the event.
  const rawBody = await req.arrayBuffer();
  const body = Buffer.from(rawBody);
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }
  
  console.log(`Received Stripe webhook event: ${event.type}`);

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const userId = session.metadata?.userId;
    if (!userId) {
      console.error('Webhook Error: No userId in session metadata');
      return NextResponse.json({ error: 'No userId in session metadata' }, { status: 400 });
    }
    
    console.log(`Processing checkout.session.completed for user: ${userId}`);

    try {
      // Check if Firebase Admin was initialized
      if (admin.apps.length === 0) {
        throw new Error("Firebase Admin SDK is not initialized. Check server logs for initialization errors.");
      }
      const firestore = admin.firestore();
      const userDocRef = firestore.collection('users').doc(userId);

      // Use the Admin SDK to update the user's subscription tier to 'premium'
      await userDocRef.update({
        subscriptionTier: 'premium',
      });
      
      console.log(`✅ Successfully upgraded user ${userId} to premium via webhook.`);

    } catch (dbError: any) {
      console.error(`❌ Database update failed for user ${userId}:`, dbError.message);
      return NextResponse.json({ error: `Database update failed: ${dbError.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
