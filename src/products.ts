import {stripe} from "./config";

export async function listAllProducts() {
    return stripe.products.list({
        active: true
    });
}

export async function listAllPricesForProduct(productId?: string) {
    return stripe.prices.list({
        product: productId
    });
}
