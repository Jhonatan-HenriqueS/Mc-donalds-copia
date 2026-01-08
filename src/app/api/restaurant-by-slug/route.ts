import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Slug é obrigatório' },
        { status: 400 }
      );
    }

    const restaurant = await db.restaurant.findUnique({
      where: { slug },
      select: {
        id: true,
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: 'Restaurante não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      restaurantId: restaurant.id,
    });
  } catch (error) {
    console.error('Erro ao buscar restaurante:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar restaurante' },
      { status: 500 }
    );
  }
}
