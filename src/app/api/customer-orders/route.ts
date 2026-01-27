import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const restaurantId = searchParams.get('restaurantId');
    const email = searchParams.get('email');

    if (!restaurantId || !email) {
      return NextResponse.json(
        { success: false, error: 'Restaurant ID e email são obrigatórios' },
        { status: 400 }
      );
    }

    const orders = await db.order.findMany({
      where: {
        restaurantId,
        customerEmail: {
          equals: email.trim().toLowerCase(),
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        status: true,
        updateAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error('Erro ao buscar pedidos do cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar pedidos', orders: [] },
      { status: 500 }
    );
  }
}
