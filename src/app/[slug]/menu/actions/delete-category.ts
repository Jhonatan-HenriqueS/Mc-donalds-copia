'use server';

import { revalidatePath } from 'next/cache';

import { verifyRestaurantOwner } from '@/app/actions/session';
import { db } from '@/lib/prisma';

export const deleteCategory = async (
  categoryId: string,
  restaurantId: string
) => {
  try {
    // Verificar se o usuário está autenticado e é dono do restaurante
    const isOwner = await verifyRestaurantOwner(restaurantId);
    if (!isOwner) {
      return {
        success: false,
        error: 'Acesso negado. Você não tem permissão para excluir categorias.',
      };
    }

    // Verificar se a categoria existe
    const category = await db.menuCategory.findUnique({
      where: {
        id: categoryId,
      },
      include: {
        products: true,
      },
    });

    if (!category) {
      return {
        success: false,
        error: 'Categoria não encontrada',
      };
    }

    // Verificar se a categoria pertence ao restaurante
    if (category.restaurantId !== restaurantId) {
      return {
        success: false,
        error: 'Categoria não pertence a este restaurante',
      };
    }

    // Verificar se a categoria tem produtos
    if (category.products.length > 0) {
      return {
        success: false,
        error:
          'Não é possível excluir uma categoria que possui produtos. Exclua os produtos primeiro.',
      };
    }

    // Excluir categoria
    await db.menuCategory.delete({
      where: {
        id: categoryId,
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
    return { success: false, error: 'Erro ao excluir categoria' };
  }
};
