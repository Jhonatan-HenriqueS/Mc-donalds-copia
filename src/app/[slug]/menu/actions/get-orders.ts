'use server';

import { verifyRestaurantOwner } from '@/app/actions/session';
import { db } from '@/lib/prisma';

export const getOrders = async (restaurantId: string) => {
  try {
    // Verificar se o usuário está autenticado e é dono do restaurante
    const isOwner = await verifyRestaurantOwner(restaurantId);
    if (!isOwner) {
      return {
        success: false,
        error: 'Acesso negado. Você não tem permissão para visualizar pedidos.',
        orders: [],
      };
    }

    // Buscar todos os pedidos do restaurante
    const orders = await db.order.findMany({
      where: {
        restaurantId,
      },
      include: {
        orderProducts: {
          include: {
            product: {
              select: {
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      orders,
    };
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message, orders: [] };
    }
    return { success: false, error: 'Erro ao buscar pedidos', orders: [] };
  }
};

