"Rota gerenciada com stripe listen --forward-to http://localhost:3000/api/webhooks/stripe";

import { NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/lib/prisma";

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe error secret key");
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
  });

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.error();
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_KEY;

  if (!webhookSecret) {
    throw new Error("Stripe error secret key");
  }

  const text = await request.text();

  const event = stripe.webhooks.constructEvent(text, signature, webhookSecret);

  const paymentSucess = event.type === "checkout.session.completed";

  if (paymentSucess) {
    //se o pagamento foi aprovado faça isso

    const orderId = event.data.object.metadata?.orderId; //pega o orderId do metadata do create-checkout-stripe.ts

    if (!orderId) {
      return NextResponse.json({ received: true });
    }

    await db.order.update({
      where: {
        id: Number(orderId),
      },
      data: {
        status: "PAYMENT_CONFIRMED",
      },
    });
  }
  return NextResponse.json({
    received: true, //diz pro stripe que este processamento de ordem de pedido e seu orderId já está feito
  });
}
