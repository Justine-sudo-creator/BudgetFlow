
import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import * as admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';

// Function to initialize Firebase Admin SDK.
// This will be called only when the webhook is hit.
const initializeFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Vercel escapes newlines, so we need to replace them.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('CRITICAL: Missing one or more required Firebase Admin SDK environment variables.');
  }

  const serviceAccount: ServiceAccount = {
    projectId,
    clientEmail,
    privateKey,
  };

  try {
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully inside webhook.");
    return app;
  } catch (error: any) {
    console.error('CRITICAL: Firebase Admin SDK initialization failed inside webhook.', error.message);
    throw new Error('Firebase Admin SDK could not be initialized.');
  }
};

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Webhook Error: STRIPE_WEBHOOK_SECRET is not set.');
    return NextResponse.json({ error: 'Server configuration error: Webhook secret not set.' }, { status: 500 });
  }

  const rawBody = await req.arrayBuffer();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(Buffer.from(rawBody), signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }
  
  console.log(`Received Stripe webhook event: ${event.type}`);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const userId = session.metadata?.userId;
    if (!userId) {
      console.error('Webhook Error: No userId in session metadata');
      return NextResponse.json({ error: 'No userId in session metadata' }, { status: 400 });
    }
    
    console.log(`Processing checkout.session.completed for user: ${userId}`);

    try {
      // Initialize Firebase Admin SDK here, at runtime.
      initializeFirebaseAdmin();
      
      const firestore = admin.firestore();
      const userDocRef = firestore.collection('users').doc(userId);

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
