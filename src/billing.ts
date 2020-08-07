import {db, stripe} from "./config";
import {getOrCreateCustomer} from "./cutomers";
import {Stripe} from "stripe";
import {firestore} from "firebase-admin";


/**
 * Attaches a payment method to the Stripe customer, and Subscribes to a Stripe plan, and saves the plan.id for later reference to firestore
 */
export async function createSubscription(userId: string, plan: string, payment_method: string) {
    const customer = await getOrCreateCustomer(userId);

    // Attaches the payment method, to the customer
    await stripe.paymentMethods.attach(payment_method, {customer: customer.id})

    // Set it as the default payment method
    await stripe.customers.update(customer.id, {
        invoice_settings: {default_payment_method: payment_method}
    });

    const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{plan}],
        expand: ['latest_invoice.payment_intent']
    });

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const payment_intent = invoice.payment_intent as Stripe.PaymentIntent;

    if (payment_intent.status === 'succeeded') {
        await db
            .collection('users')
            .doc(userId)
            .set(
                {
                    stripeCustomerId: customer.id,
                    activePlans: firestore.FieldValue.arrayUnion(plan)
                },
                {merge: true}
            )
    }

    return subscription;
}


/**
 * Cancels a subscription on a user, at the end of the subscription period!
 * @param userId
 * @param subscriptionId
 */
export async function cancelSubscription(userId: string, subscriptionId: string) {
    const customer = await getOrCreateCustomer(userId);
    if (customer.metadata.firebaseUID !== userId) {
        throw Error('Stripe customerID does not match user!')
    }

    //const subscription = await stripe.subscriptions.del(subscriptionId);
    const subscription = await stripe.subscriptions.update(subscriptionId, {cancel_at_period_end: true});

    // If the subscription is canceled immediately. Tell the database - if its a cancel_at_period_end, we will handle this in a webhook!
    if (subscription.status === 'canceled') {
        await db
            .collection('users')
            .doc(userId)
            .update({
                activePlans: firestore.FieldValue.arrayRemove(subscription.plan.id)
            });
    }
    return subscription;
}



/**
 * Cancels a subscription on a user, at the end of the subscription period!
 * @param userId
 * @param subscriptionId
 */
export async function reactivateSubscription(userId: string, subscriptionId: string) {
    const customer = await getOrCreateCustomer(userId);
    if (customer.metadata.firebaseUID !== userId) {
        throw Error('Stripe customerID does not match user!')
    }

    //const subscription = await stripe.subscriptions.del(subscriptionId);
    return await stripe.subscriptions.update(subscriptionId, {cancel_at_period_end: false});
}





/**
 * Returns all subscriptions linked to a firebase UID in stripe!
 * @param userId
 */
export async function listSubscriptions(userId: string) {
    const customer = await getOrCreateCustomer(userId);

    return stripe.subscriptions.list({
        customer: customer.id
    });

}
