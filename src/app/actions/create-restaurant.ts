'use server';

import { db } from '@/lib/prisma';

import { createSession } from './session';

interface CreateRestaurantInput {
  name: string;
  slug: string;
  imageUrl: string;
  coverImageUrl: string;
  userId: string;
}

export const createRestaurant = async (input: CreateRestaurantInput) => {
  try {
    // Validar userId
    if (!input.userId || input.userId.trim() === '') {
      return { success: false, error: 'ID do usuário é obrigatório' };
    }

    // Verificar se o slug já existe
    const existingRestaurant = await db.restaurant.findUnique({
      where: {
        slug: input.slug,
      },
    });

    if (existingRestaurant) {
      return { success: false, error: 'Slug já está em uso' };
    }

    // Verificar se o usuário existe
    const user = await db.user.findUnique({
      where: {
        id: input.userId,
      },
    });

    if (!user) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    // Criar restaurante
    const restaurant = await db.restaurant.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: '',
        avatarImageUrl: input.imageUrl,
        coverImageUrl: input.coverImageUrl,
        isOpen: true,
        allowDineIn: true,
        allowTakeaway: true,
        userId: input.userId,
      },
    });

    // Criar sessão após criar restaurante
    await createSession(input.userId);

    return { success: true, restaurant };
  } catch (error) {
    console.error(
      'Erro ao criar restaurante:',
      error ?? 'erro nulo (null/undefined)'
    );

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return {
      success: false,
      error: 'Erro desconhecido ao criar restaurante',
    };
  }
};
