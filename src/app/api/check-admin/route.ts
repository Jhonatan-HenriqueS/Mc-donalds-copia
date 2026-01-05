import { NextRequest, NextResponse } from 'next/server';

import { verifyRestaurantOwner } from '@/app/actions/session';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json(
        { isOwner: false, error: 'Restaurant ID é obrigatório' },
        { status: 400 }
      );
    }

    const isOwner = await verifyRestaurantOwner(restaurantId);

    return NextResponse.json({ isOwner });
  } catch (error) {
    console.error('Erro ao verificar admin:', error);
    return NextResponse.json(
      { isOwner: false, error: 'Erro ao verificar permissões' },
      { status: 500 }
    );
  }
}
