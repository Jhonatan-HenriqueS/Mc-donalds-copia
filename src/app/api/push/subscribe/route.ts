import { NextRequest, NextResponse } from 'next/server';

import { verifyRestaurantOwner } from '@/app/actions/session';
import { db } from '@/lib/prisma';

type SubscribeBody = {
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  type: 'ADMIN' | 'CUSTOMER';
  restaurantId?: string;
  orderId?: number;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SubscribeBody;
    const endpoint = body?.subscription?.endpoint;
    const p256dh = body?.subscription?.keys?.p256dh;
    const auth = body?.subscription?.keys?.auth;

    if (!endpoint || !p256dh || !auth || !body?.type) {
      return NextResponse.json(
        { success: false, error: 'Dados de subscription inválidos' },
        { status: 400 }
      );
    }

    if (body.type === 'ADMIN') {
      if (!body.restaurantId) {
        return NextResponse.json(
          { success: false, error: 'restaurantId é obrigatório' },
          { status: 400 }
        );
      }
      const isOwner = await verifyRestaurantOwner(body.restaurantId);
      if (!isOwner) {
        return NextResponse.json(
          { success: false, error: 'Acesso negado' },
          { status: 403 }
        );
      }
    }

    if (body.type === 'CUSTOMER') {
      if (!body.orderId) {
        return NextResponse.json(
          { success: false, error: 'orderId é obrigatório' },
          { status: 400 }
        );
      }
      const order = await db.order.findUnique({
        where: { id: body.orderId },
        select: { id: true },
      });
      if (!order) {
        return NextResponse.json(
          { success: false, error: 'Pedido não encontrado' },
          { status: 404 }
        );
      }
    }

    const subscription = await db.pushSubscription.upsert({
      where: { endpoint },
      update: {
        p256dh,
        auth,
        type: body.type,
        restaurantId: body.type === 'ADMIN' ? body.restaurantId : null,
        orderId: body.type === 'CUSTOMER' ? body.orderId : null,
      },
      create: {
        endpoint,
        p256dh,
        auth,
        type: body.type,
        restaurantId: body.type === 'ADMIN' ? body.restaurantId : null,
        orderId: body.type === 'CUSTOMER' ? body.orderId : null,
      },
    });

    return NextResponse.json({ success: true, subscriptionId: subscription.id });
  } catch (error) {
    console.error('Erro ao salvar subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao salvar subscription' },
      { status: 500 }
    );
  }
}
