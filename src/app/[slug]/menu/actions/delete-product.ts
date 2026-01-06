'use server';

import { revalidatePath } from 'next/cache';

import { verifyRestaurantOwner } from '@/app/actions/session';
import { db } from '@/lib/prisma';

export const deleteProduct = async (
  productId: string,
  restaurantId: string
) => {
  try {
    // Verificar se o usuário está autenticado e é dono do restaurante
    const isOwner = await verifyRestaurantOwner(restaurantId);
    if (!isOwner) {
      return {
        success: false,
        error: 'Acesso negado. Você não tem permissão para excluir produtos.',
      };
    }

    // Verificar se o produto existe
    const product = await db.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      return {
        success: false,
        error: 'Produto não encontrado',
      };
    }

    // Verificar se o produto pertence ao restaurante
    if (product.restaurantId !== restaurantId) {
      return {
        success: false,
        error: 'Produto não pertence a este restaurante',
      };
    }

    // Excluir produto
    await db.product.delete({
      where: {
        id: productId,
      },
    });

    // Revalidar a página do menu
    const restaurant = await db.restaurant.findUnique({
      where: { id: restaurantId },
      select: { slug: true },
    });

    if (restaurant) {
      revalidatePath(`/${restaurant.slug}/menu`);
    }

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro ao excluir produto' };
  }
};
