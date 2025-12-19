
import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import * as admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';

// =================================================================
// Function to initialize Firebase Admin SDK
// =================================================================
const initializeFirebaseAdmin = () => {
  // Check if the app is already initialized to prevent errors
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Validate environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing required Firebase Admin SDK environment variables.');
  }

  const serviceAccount: ServiceAccount = {
    projectId,
    clientEmail,
    // The private key must be properly formatted.
    // Vercel escapes newlines, so we need to replace them.
    privateKey: privateKey.replace(/\\n/g, '\n'),
  };

  try {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    // Log the detailed error for better debugging
    console.error('Firebase Admin Initialization Error:', error.message);
    throw new Error('Failed to initialize Firebase Admin SDK.');
  }
};
// =================================================================


export async function POST(req: NextRequest) {
  let firestore: admin.firestore.Firestore;
  try {
    const adminApp = initializeFirebaseAdmin();
    firestore = admin.firestore();
  } catch (initError: any) {
    console.error('CRITICAL: Webhook failed to initialize Firebase Admin.', initError.message);
    return NextResponse.json({ error: `Server Configuration Error: ${initError.message}` }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  if (!webhookSecret) {
    console.error('Webhook Error: STRIPE_WEBHOOK_SECRET is not set.');
    return NextResponse.json({ error: 'Webhook secret is not configured.' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
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
      const userDocRef = firestore.collection('users').doc(userId);

      // Use the Admin SDK to update the user's subscription tier to 'premium'
      await userDocRef.update({
        subscriptionTier: 'premium',
      });
      
      console.log(`Successfully upgraded user ${userId} to premium via webhook.`);

    } catch (dbError: any) {
      console.error(`Database update failed for user ${userId}:`, dbError);
      return NextResponse.json({ error: `Database update failed: ${dbError.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
