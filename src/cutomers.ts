import {Stripe} from "stripe";
import {db, stripe} from "./config";

/**
 * Gets or create a stripe customer! And adds relevant data to the Database
 * @param userId
 * @param params
 */
export async function getOrCreateCustomer(userId: string, params?: Stripe.CustomerCreateParams) {

    const userSnapshot = await db.collection('users').doc(userId).get();

    const {stripeCustomerId, email} = userSnapshot.data();

    // If missing stripeCustomerId, create it!
    if (!stripeCustomerId) {
        // Create new customer!
        const customer = await stripe.customers.create({
            email,
            metadata: {
                firebaseUID: userId
            },
            ...params
        });
        await userSnapshot.ref.update({stripeCustomerId: customer.id})
        return customer;
    } else {
        return await stripe.customers.retrieve(stripeCustomerId) as Stripe.Customer;
    }


}


/**
 * Creates a new SetupIntent
 * @param userId
 */
export async function createSetupIntent(userId: string) {
    const customer = await getOrCreateCustomer(userId);

    return stripe.setupIntents.create({
        customer: customer.id,
    });

}


/**
 * Lists all paymentMethods associated to a userId (a firebase user)
 * @param userId
 */
export async function listPaymentMethods(userId: string) {
    const customer = await getOrCreateCustomer(userId);

    return stripe.paymentMethods.list({
        customer: customer.id,
        type: 'card'
    })

}
