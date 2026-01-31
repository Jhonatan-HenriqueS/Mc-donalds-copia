'use server';

import { verifyRestaurantOwner } from '@/app/actions/session';
import { db } from '@/lib/prisma';

export const updatePaymentMethod = async (
  paymentMethodId: string,
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

    const existing = await db.paymentMethod.findUnique({
      where: { id: paymentMethodId },
      select: { restaurantId: true },
    });

    if (!existing || existing.restaurantId !== restaurantId) {
      return { success: false, error: 'Forma de pagamento não encontrada.' };
    }

    const paymentMethod = await db.paymentMethod.update({
      where: { id: paymentMethodId },
      data: { name: trimmed },
    });

    return { success: true, paymentMethod };
  } catch (error) {
    console.error('Erro ao atualizar forma de pagamento:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro ao atualizar forma de pagamento' };
  }
};
