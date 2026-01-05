'use server';

import { revalidatePath } from 'next/cache';

import { verifyRestaurantOwner } from '@/app/actions/session';
import { db } from '@/lib/prisma';

interface CreateCategoryInput {
  name: string;
  restaurantId: string;
}

export const createCategory = async (input: CreateCategoryInput) => {
  try {
    // Verificar se o usuário está autenticado e é dono do restaurante
    const isOwner = await verifyRestaurantOwner(input.restaurantId);
    if (!isOwner) {
      return {
        success: false,
        error: 'Acesso negado. Você não tem permissão para criar categorias.',
      };
    }

    // Verificar se o restaurante existe
    const restaurant = await db.restaurant.findUnique({
      where: {
        id: input.restaurantId,
      },
    });

    if (!restaurant) {
      throw new Error('Restaurante não encontrado');
    }

    // Criar categoria
    const category = await db.menuCategory.create({
      data: {
        name: input.name.trim(),
        restaurantId: input.restaurantId,
      },
    });

    // Revalidar a página do menu
    revalidatePath(`/${restaurant.slug}/menu`);

    return { success: true, category };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro ao criar categoria' };
  }
};
