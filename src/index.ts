import * as functions from 'firebase-functions';
import {db} from "./config";
import {createStripeCheckoutSession} from "./checkout";
import {createPaymentIntent} from "./payments";
import {handleStripeWebhook} from "./webhooks";
import {createSetupIntent, getOrCreateCustomer, listPaymentMethods} from "./cutomers";
import {cancelSubscription, createSubscription, listSubscriptions, reactivateSubscription} from "./billing";
import {listAllPricesForProduct, listAllProducts} from "./products";
import {HttpsError} from "firebase-functions/lib/providers/https";


/**
 * READ BEFORE DOING! - This code uses "region europe-west2" in firebase! - remove region specific functions simply by replacing .region(xxx),
 * with 'nothing' or your preferred region. (I recommend choosing the region closest to you customer.)
 *
 * Example 1 with another region:  functions.region('my-awesome-fb-region').https.OnCall(async (data, context) => {
 *     ...MyCode Here
 * })
 *
 * Example 2 with no region - (defaults to us-west):  functions.https.OnCall(async (data, context) => {
 *     ...MyCode Here
 * })
 *
 */



/**
 * Creates a checkout session, and returns the session data
 */
exports.StripeCreateCheckoutSession = functions.region('europe-west2').https.onCall(async (data, context) => {
    if (context.auth) {
        return await createStripeCheckoutSession(data.line_items, context.auth.uid);
    } else {
        throw new HttpsError("unauthenticated", "Request had invalid credentials.");
    }
})

/**
 * Creates a new payment intent, takes an amount in the body ex. {amount: 300}
 */
exports.StripeCreatePaymentIntent = functions.region('europe-west2').https.onCall(async (data, context) => {
    if (context.auth) {
        return await createPaymentIntent(data.amount);
    } else {
        throw new HttpsError("unauthenticated", "Request had invalid credentials.");
    }
})


/**
 * Will save a customers card, onto their wallet!
 */
exports.StripeSavePaymentMethod = functions.region('europe-west2').https.onCall(async (data, context) => {
    if (context.auth) {
        return await createSetupIntent(context.auth.uid);
    } else {
        throw new HttpsError("unauthenticated", "Request had invalid credentials.");
    }
})

/**
 * Will list all cards associated to a customer!
 */
exports.StripeListPaymentMethods = functions.region('europe-west2').https.onCall(async (data, context) => {
    if (context.auth) {
        const wallet = await listPaymentMethods(context.auth.uid);
        return wallet.data;
    } else {
        throw new HttpsError("unauthenticated", "Request had invalid credentials.");
    }
})


/**
 * Creates a new subscription, and adds it the the client
 */
exports.StripeCreateSubscription = functions.region('europe-west2').https.onCall(async (data, context) => {
    if (context.auth) {
        const {plan, payment_method} = data;
        return await createSubscription(context.auth.uid, plan, payment_method);
    } else {
        throw new HttpsError("unauthenticated", "Request had invalid credentials.");
    }
})

/**
 * Lists all subscriptions attached to a firebase UID
 */
exports.StripeListSubscriptions = functions.region('europe-west2').https.onCall(async (data, context) => {
    if (context.auth) {
        const subscriptions = await listSubscriptions(context.auth.uid);
        return subscriptions.data;
    } else {
        throw new HttpsError("unauthenticated", "Request had invalid credentials.");
    }
})

/**
 * Cancels a subscription for the user, at the end of the current billing period!
 */
exports.StripeCancelSubscription = functions.region('europe-west2').https.onCall(async (data, context) => {
    if (context.auth) {
        const {subscriptionId} = data;
        return await cancelSubscription(context.auth.uid, subscriptionId);
    } else {
        throw new HttpsError("unauthenticated", "Request had invalid credentials.");
    }
})

exports.StripeReactivateSubscription = functions.region('europe-west2').https.onCall(async (data, context) => {
    if (context.auth) {
        const {subscriptionId} = data;
        return await reactivateSubscription(context.auth.uid, subscriptionId);
    } else {
        throw new HttpsError("unauthenticated", "Request had invalid credentials.");
    }
});

exports.StripeGetAllProducts = functions.region('europe-west2').https.onCall(async (data, context) => {
    if (context.auth) {
        return listAllProducts();
    } else {
        throw new HttpsError("unauthenticated", "Request had invalid credentials.");
    }
});

exports.StripeGetAllPricesForProduct = functions.region('europe-west2').https.onCall(async (data, context) => {
    if (context.auth) {
        return listAllPricesForProduct(data.productId);
    } else {
        throw new HttpsError("unauthenticated", "Request had invalid credentials.");
    }
});


/**
 * Will take incoming requests from Stripe. And handle them accordingly!
 */
exports.WebhookStripe = functions.region('europe-west2').https.onRequest(handleStripeWebhook)


/**
 * Will create a user document, when a new user signs up!
 */
exports.CreateUserDocOnSignUp = functions.region('europe-west2').auth.user().onCreate(async (user, context) => {
    await db.collection('users').doc(user.uid).create({
        email: user.email
    });
    await getOrCreateCustomer(user.uid); // This functions creates the user in stripe + adds the customer ID to the database
});
