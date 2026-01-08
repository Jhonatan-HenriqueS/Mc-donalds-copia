'use server';

import { verifyRestaurantOwner } from '@/app/actions/session';
import { db } from '@/lib/prisma';

export const getOrdersCount = async (restaurantId: string) => {
  try {
    // Verificar se o usuário está autenticado e é dono do restaurante
    const isOwner = await verifyRestaurantOwner(restaurantId);
    if (!isOwner) {
      return {
        success: false,
        error: 'Acesso negado',
        count: 0,
        orderIds: [],
      };
    }

    // Buscar apenas ID e count dos pedidos
    const orders = await db.order.findMany({
      where: {
        restaurantId,
      },
      select: {
        id: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      count: orders.length,
      orderIds: orders.map((order) => order.id),
    };
  } catch (error) {
    console.error('Erro ao buscar contador de pedidos:', error);
    return {
      success: false,
      error: 'Erro ao buscar contador de pedidos',
      count: 0,
      orderIds: [],
    };
  }
};
