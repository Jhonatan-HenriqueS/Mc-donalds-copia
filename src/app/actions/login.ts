'use server';

import bcrypt from 'bcryptjs';

import { db } from '@/lib/prisma';

interface LoginInput {
  email: string;
  password: string;
}

export const login = async (input: LoginInput) => {
  try {
    // Buscar usuário pelo email
    const user = await db.user.findUnique({
      where: {
        email: input.email.trim(),
      },
    });

    if (!user) {
      return { success: false, error: 'Email ou senha incorretos' };
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(input.password, user.password);

    if (!isPasswordValid) {
      return { success: false, error: 'Email ou senha incorretos' };
    }

    // Buscar restaurante associado ao usuário
    const restaurants = await db.restaurant.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Se não houver restaurante, redirecionar para criar
    if (restaurants.length === 0) {
      return {
        success: true,
        userId: user.id,
        user,
        restaurantSlug: null,
        needsRestaurant: true,
      };
    }

    // Usar o primeiro restaurante do usuário
    const restaurant = restaurants[0];

    return {
      success: true,
      userId: user.id,
      user,
      restaurantSlug: restaurant.slug,
      needsRestaurant: false,
    };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro ao fazer login' };
  }
};
