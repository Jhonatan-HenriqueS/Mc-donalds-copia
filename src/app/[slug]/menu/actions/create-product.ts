'use server';

import { revalidatePath } from 'next/cache';

import { verifyRestaurantOwner } from '@/app/actions/session';
import { db } from '@/lib/prisma';

interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  ingredients: string[];
  menuCategoryId: string;
  restaurantId: string;
}

export const createProduct = async (input: CreateProductInput) => {
  try {
    // Verificar se o usuário está autenticado e é dono do restaurante
    const isOwner = await verifyRestaurantOwner(input.restaurantId);
    if (!isOwner) {
      return {
        success: false,
        error: 'Acesso negado. Você não tem permissão para criar produtos.',
      };
    }

    // Verificar se a categoria existe
    const category = await db.menuCategory.findUnique({
      where: {
        id: input.menuCategoryId,
      },
    });

    if (!category) {
      throw new Error('Categoria não encontrada');
    }

    // Verificar se a categoria pertence ao restaurante
    if (category.restaurantId !== input.restaurantId) {
      throw new Error('Categoria não pertence a este restaurante');
    }

    // Criar produto
    const product = await db.product.create({
      data: {
        name: input.name,
        description: input.description,
        price: input.price,
        imageUrl: input.imageUrl,
        ingredients: input.ingredients,
        menuCategoryId: input.menuCategoryId,
        restaurantId: input.restaurantId,
      },
    });

    // Revalidar a página do menu
    const restaurant = await db.restaurant.findUnique({
      where: { id: input.restaurantId },
      select: { slug: true },
    });

    if (restaurant) {
      revalidatePath(`/${restaurant.slug}/menu`);
    }

    return { success: true, product };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro ao criar produto' };
  }
};
