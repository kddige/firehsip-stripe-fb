# firehsip-stripe-fb
Fireship.io - Stripe Course as Firebase cloud functions!

# Installation
Simple. Clone the repo. And run the following from the repo folder:
```sh
$ npm i --save
```

# Config
Remember to set the following in your firebase config.

```sh
$ firebase functions:config:set stripe.secret="YOUR STRIPE SECRET KEY"
$ firebase funcitons:config:set stripe.whsec="YOUR WEBHOOK SECRET KEY" // This one is webhook specific
$ firebase functions:config:set web.url="MY AWESOME STRIPE WEBSITE!" // This one is only used in the "checkout.ts"
```

# ALSO...
Remember to init this as a firebase functions folder:
```sh
$ firebase init functions
```
