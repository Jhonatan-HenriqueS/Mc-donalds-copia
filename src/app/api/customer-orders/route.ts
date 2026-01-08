import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/prisma';

import { removeCpfPunctuation } from '../../[slug]/menu/helpers/cpf';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const restaurantId = searchParams.get('restaurantId');
    const cpf = searchParams.get('cpf');

    if (!restaurantId || !cpf) {
      return NextResponse.json(
        { success: false, error: 'Restaurant ID e CPF são obrigatórios' },
        { status: 400 }
      );
    }

    const orders = await db.order.findMany({
      where: {
        restaurantId,
        customerCpf: removeCpfPunctuation(cpf),
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
