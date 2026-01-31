'use server';

import { verifyRestaurantOwner } from '@/app/actions/session';
import { db } from '@/lib/prisma';

export const createPaymentMethod = async (
  restaurantId: string,
  name: string
) => {
  try {
    const isOwner = await verifyRestaurantOwner(restaurantId);
    if (!isOwner) {
      return {
        success: false,
        error: 'Acesso negado. Você não tem permissão para editar.',
      };
    }

    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, error: 'Nome da forma de pagamento é obrigatório.' };
    }

    const paymentMethod = await db.paymentMethod.create({
      data: {
        name: trimmed,
        restaurantId,
      },
    });

    return { success: true, paymentMethod };
  } catch (error) {
    console.error('Erro ao criar forma de pagamento:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro ao criar forma de pagamento' };
  }
};
