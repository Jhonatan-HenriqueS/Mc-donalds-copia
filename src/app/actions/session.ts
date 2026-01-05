'use server';

import { cookies } from 'next/headers';

import { db } from '@/lib/prisma';

const SESSION_COOKIE_NAME = 'user_session';
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 dias em segundos

export interface SessionData {
  userId: string;
  email: string;
  name: string;
}

export const createSession = async (userId: string) => {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION,
      path: '/',
    });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  } catch (error) {
    console.error('Erro ao criar sessão:', error);
    return { success: false, error: 'Erro ao criar sessão' };
  }
};

export const getSession = async (): Promise<SessionData | null> => {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionId) {
      return null;
    }

    const user = await db.user.findUnique({
      where: { id: sessionId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
    };
  } catch (error) {
    console.error('Erro ao obter sessão:', error);
    return null;
  }
};

export const destroySession = async () => {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    return { success: true };
  } catch (error) {
    console.error('Erro ao destruir sessão:', error);
    return { success: false, error: 'Erro ao fazer logout' };
  }
};

export const verifyRestaurantOwner = async (
  restaurantId: string
): Promise<boolean> => {
  try {
    const session = await getSession();
    if (!session) {
      return false;
    }

    const restaurant = await db.restaurant.findUnique({
      where: { id: restaurantId },
      select: { userId: true },
    });

    if (!restaurant) {
      return false;
    }

    return restaurant.userId === session.userId;
  } catch (error) {
    console.error('Erro ao verificar dono do restaurante:', error);
    return false;
  }
};

export const verifyRestaurantOwnerBySlug = async (
  slug: string
): Promise<boolean> => {
  try {
    const session = await getSession();
    if (!session) {
      return false;
    }

    const restaurant = await db.restaurant.findUnique({
      where: { slug },
      select: { userId: true },
    });

    if (!restaurant) {
      return false;
    }

    return restaurant.userId === session.userId;
  } catch (error) {
    console.error('Erro ao verificar dono do restaurante:', error);
    return false;
  }
};
