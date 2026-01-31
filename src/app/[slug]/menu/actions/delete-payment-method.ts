'use server';

import { verifyRestaurantOwner } from '@/app/actions/session';
import { db } from '@/lib/prisma';

export const deletePaymentMethod = async (
  paymentMethodId: string,
  restaurantId: string
) => {
  try {
    const isOwner = await verifyRestaurantOwner(restaurantId);
    if (!isOwner) {
      return {
        success: false,
        error: 'Acesso negado. Você não tem permissão para editar.',
      };
    }

    const existing = await db.paymentMethod.findUnique({
      where: { id: paymentMethodId },
      select: { restaurantId: true },
    });

    if (!existing || existing.restaurantId !== restaurantId) {
      return { success: false, error: 'Forma de pagamento não encontrada.' };
    }

    await db.paymentMethod.delete({
      where: { id: paymentMethodId },
    });

    return { success: true };
  } catch (error) {
    console.error('Erro ao remover forma de pagamento:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro ao remover forma de pagamento' };
  }
};
