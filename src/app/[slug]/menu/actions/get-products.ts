'use server';

import { verifyRestaurantOwner } from '@/app/actions/session';
import { db } from '@/lib/prisma';

export const getProducts = async (restaurantId: string) => {
  try {
    // Verificar se o usuário está autenticado e é dono do restaurante
    const isOwner = await verifyRestaurantOwner(restaurantId);
    if (!isOwner) {
      return {
        success: false,
        error:
          'Acesso negado. Você não tem permissão para visualizar produtos.',
        products: [],
      };
    }

    // Buscar todos os produtos do restaurante
    const products = await db.product.findMany({
      where: {
        restaurantId,
      },
      include: {
        menuCategory: {
          select: {
            id: true,
            name: true,
          },
        },
        sizes: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      products,
    };
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message, products: [] };
    }
    return { success: false, error: 'Erro ao buscar produtos', products: [] };
  }
};
