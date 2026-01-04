'Rota gerenciada com stripe listen --forward-to http://localhost:3000/api/webhooks/stripe';

import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { db } from '@/lib/prisma';

export async function POST(request: Request) {
  console.log('[WEBHOOK] Iniciando processamento do webhook do Stripe');

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[WEBHOOK] Erro: STRIPE_SECRET_KEY não encontrada');
    throw new Error('Stripe error secret key');
  }

  console.log('[WEBHOOK] Stripe client inicializado');

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia',
  });

  const signature = request.headers.get('stripe-signature');
  console.log('[WEBHOOK] Signature recebida:', signature ? 'Sim' : 'Não');

  if (!signature) {
    console.error('[WEBHOOK] Erro: Signature não encontrada no header');
    return NextResponse.error();
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_KEY;

  if (!webhookSecret) {
    console.error('[WEBHOOK] Erro: STRIPE_WEBHOOK_SECRET_KEY não encontrada');
    throw new Error('Stripe error secret key');
  }

  console.log('[WEBHOOK] Webhook secret encontrado');

  const text = await request.text();
  console.log('[WEBHOOK] Payload recebido, tamanho:', text.length, 'bytes');

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(text, signature, webhookSecret);
    console.log('[WEBHOOK] Evento construído com sucesso');
    console.log('[WEBHOOK] Tipo do evento:', event.type);
    console.log('[WEBHOOK] ID do evento:', event.id);
  } catch (error) {
    console.error('[WEBHOOK] Erro ao construir evento:', error);
    throw error;
  }

  const paymentSucess = event.type === 'checkout.session.completed';
  console.log('[WEBHOOK] Payment success?', paymentSucess);

  if (paymentSucess) {
    //se o pagamento foi aprovado faça isso
    console.log('[WEBHOOK] Processando checkout.session.completed');

    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId; //pega o orderId do metadata do create-checkout-stripe.ts
    console.log('[WEBHOOK] OrderId extraído do metadata:', orderId);
    console.log(
      '[WEBHOOK] Metadata completo:',
      JSON.stringify(session.metadata, null, 2)
    );

    if (!orderId) {
      console.warn('[WEBHOOK] Aviso: OrderId não encontrado no metadata');
      return NextResponse.json({ received: true });
    }

    console.log(
      '[WEBHOOK] Atualizando pedido no banco de dados, orderId:',
      orderId
    );

    try {
      const updatedOrder = await db.order.update({
        where: {
          id: Number(orderId),
        },
        data: {
          status: 'PAYMENT_CONFIRMED',
        },
      });
      console.log('[WEBHOOK] Pedido atualizado com sucesso:', {
        id: updatedOrder.id,
        status: updatedOrder.status,
      });
    } catch (error) {
      console.error('[WEBHOOK] Erro ao atualizar pedido:', error);
      throw error;
    }
  } else {
    console.log('[WEBHOOK] Evento não é checkout.session.completed, ignorando');
  }

  console.log('[WEBHOOK] Webhook processado com sucesso');
  return NextResponse.json({
    received: true, //diz pro stripe que este processamento de ordem de pedido e seu orderId já está feito
  });
}
