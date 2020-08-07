import {stripe} from './config';
import Stripe from 'stripe';
import {getOrCreateCustomer} from "./cutomers";
import * as functions from 'firebase-functions';

export async function createStripeCheckoutSession(
    line_items: Stripe.Checkout.SessionCreateParams.LineItem[],
    userId: string
) {
    const customer = await getOrCreateCustomer(userId);

    return await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: "subscription",
        line_items,
        success_url: `${functions.config().web.url}/paymentSuccess`,
        cancel_url: `${functions.config().web.url}/paymentFailed`,
        customer: customer.id
    }).catch(e => console.log(e));
}
