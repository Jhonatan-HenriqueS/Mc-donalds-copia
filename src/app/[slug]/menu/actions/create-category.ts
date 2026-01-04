'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/prisma';

interface CreateCategoryInput {
  name: string;
  restaurantId: string;
}

export const createCategory = async (input: CreateCategoryInput) => {
  try {
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
