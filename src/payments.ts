import {stripe} from './config';

export async function createPaymentIntent(amount: number) {
    return await stripe.paymentIntents.create({
        amount,
        currency: 'dkk'
    })

}
