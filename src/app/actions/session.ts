'use server';

import { createHash, randomBytes } from 'crypto';
import { cookies } from 'next/headers';

import { db } from '@/lib/prisma';

const SESSION_COOKIE_NAME = 'user_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 dias em segundos
const SESSION_DURATION_MS = SESSION_DURATION_SECONDS * 1000;
const MAX_SESSIONS_PER_USER = 5;

const hashSessionToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

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
    const existingToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (existingToken) {
      await db.userSession.deleteMany({
        where: { tokenHash: hashSessionToken(existingToken) },
      });
    }

    const sessionToken = randomBytes(48).toString('hex');
    const tokenHash = hashSessionToken(sessionToken);
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await db.userSession.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    const oldSessions = await db.userSession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      skip: MAX_SESSIONS_PER_USER,
      select: { id: true },
    });

    if (oldSessions.length > 0) {
      await db.userSession.deleteMany({
        where: { id: { in: oldSessions.map((session) => session.id) } },
      });
    }

    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_SECONDS,
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
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return null;
    }

    const tokenHash = hashSessionToken(sessionToken);
    const session = await db.userSession.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        expiresAt: true,
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    if (!session) {
      cookieStore.delete(SESSION_COOKIE_NAME);
      return null;
    }

    const now = Date.now();
    if (session.expiresAt.getTime() <= now) {
      await db.userSession.delete({ where: { id: session.id } });
      cookieStore.delete(SESSION_COOKIE_NAME);
      return null;
    }

    // Renova a sessão quando ela já passou da metade do tempo de vida.
    if (session.expiresAt.getTime() - now < SESSION_DURATION_MS / 2) {
      const newExpiresAt = new Date(now + SESSION_DURATION_MS);
      await db.userSession.update({
        where: { id: session.id },
        data: { expiresAt: newExpiresAt },
      });
      cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_DURATION_SECONDS,
        path: '/',
      });
    }

    return {
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
    };
  } catch (error) {
    console.error('Erro ao obter sessão:', error);
    return null;
  }
};

export const destroySession = async () => {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (sessionToken) {
      await db.userSession.deleteMany({
        where: { tokenHash: hashSessionToken(sessionToken) },
      });
    }
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
