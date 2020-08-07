import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Init firebase SDK
admin.initializeApp();


// Init Stripe
import Stripe from 'stripe';

export const stripe = new Stripe(functions.config().stripe.secret, {
    apiVersion: "2020-03-02"
});

// Init Firebase DB
export const db = admin.firestore();

/**
 * Remember. Set the following config in firebase
 *
 * firebase functions:config:set stripe.secret="YOUR SECRET KEY"
 *
 * firebase functions:config:set stripe.whsec="YOUR WEBHOOK SECRET"       < This one is different from webhook to webhook!
 *
 * firebase functions:config:set web.url="https://YOURWEBSITEORSOMETHING.COM/"
 *
 */
