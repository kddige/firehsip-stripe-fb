import {db, stripe} from "./config";
import * as functions from 'firebase-functions';
import {Stripe} from "stripe";
import {Response} from "express";
import {Request} from "firebase-functions/lib/providers/https";
import {firestore} from "firebase-admin";


/**
 * This code runs when requested from the webhook
 */
const webhookHandlers = {
    'payment_intent.succeeded': async (data: Stripe.PaymentIntent) => {
        // Business logic
    },
    'payment_intent.payment_failed': async (data: Stripe.PaymentIntent) => {
        // Business logic
    },
    'customer.subscription.deleted': async  (data: Stripe.Subscription) => {
        // If the subscription is canceled immediately. Do that in the database
        const customer = await stripe.customers.retrieve(data.customer as string) as Stripe.Customer;
        const userId = customer.metadata.firebaseUID;
            await db
                .collection('users')
                .doc(userId)
                .update({
                    activePlans: firestore.FieldValue.arrayRemove(data.plan.id)
                });
    },
    'customer.subscription.created': async (data: Stripe.Subscription) => {
        const customer = await stripe.customers.retrieve(data.customer as string) as Stripe.Customer;
        const userId = customer.metadata.firebaseUID;
        const userRef = db.collection('users').doc(userId);

        await userRef
            .update({
                activePlans: firestore.FieldValue.arrayUnion(data.plan.id)
            })
    },
    'invoice.payment_succeeded': async (data: Stripe.Invoice) => {
        // Business logic
    },
    'invoice.payment_failed': async (data: Stripe.Invoice) => {
        const customer = await stripe.customers.retrieve(data.customer as string) as Stripe.Customer;
        const userSnapshot = await db.collection('users').doc(customer.metadata.firebaseUID).get();
        await userSnapshot.ref.update({status: 'PAST_DUE'});
    }
}





/**
 * Validates the stripe webhook secret, and then calls the handler for the event type!
 * @param req
 * @param res
 */
export const handleStripeWebhook = async(req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(req.rawBody, sig, functions.config().stripe.whsec /*<-- Should be a config secret in production*/)
    
    try {
        await webhookHandlers[event.type](event.data.object)
        res.send({received: true})
    } catch (e) {
        console.log(e);
        res.status(400).send(`Webhook Error: ${e.message}`)
    }
}
