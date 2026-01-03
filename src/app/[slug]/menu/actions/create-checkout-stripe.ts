"use server";

import { headers } from "next/headers";
import Stripe from "stripe";

import { CartProduct } from "../context/cart";

interface createStripeCheckoutImput {
  products: CartProduct[];
  orderId: number;
}

export const createStripeCheckout = async ({
  products,
  orderId,
}: createStripeCheckoutImput) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("MIssing Stripe secret key");
  }

  const reqHeaders = await headers();

  const origin = reqHeaders.get("origin") ?? ""; //?? se diz caso não houver ele vai ter este valor ""
  //pega o local de origen aonde o usuário está ex: localHost: 3000

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    success_url: origin,
    cancel_url: origin,
    metadata: {
      orderId: orderId.toString(),
    },
    line_items: products.map((product) => ({
      price_data: {
        currency: "brl",
        product_data: {
          name: product.name,
          images: [product.imageUrl],
        },
        unit_amount: product.price * 100,
      },
      quantity: product.quantity,
    })),
  });
  return { sessionId: session.id };
};
