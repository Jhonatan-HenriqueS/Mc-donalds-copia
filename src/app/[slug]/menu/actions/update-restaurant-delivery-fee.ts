// Server action to update restaurant delivery fee
'use server';

import { revalidatePath } from 'next/cache';

import { verifyRestaurantOwner } from '@/app/actions/session';
import { db } from '@/lib/prisma';

export const updateRestaurantDeliveryFee = async (
  restaurantId: string,
  deliveryFee: number
) => {
  try {
    const isOwner = await verifyRestaurantOwner(restaurantId);
    if (!isOwner) {
      return {
        success: false,
        error: 'Acesso negado. Você não tem permissão para alterar a taxa.',
      };
    }

    if (deliveryFee < 0) {
      return {
        success: false,
        error: 'A taxa de entrega deve ser maior ou igual a zero.',
      };
    }

    const restaurant = await db.restaurant.update({
      where: { id: restaurantId },
      data: { deliveryFee },
      select: { slug: true, deliveryFee: true },
    });

    revalidatePath(`/${restaurant.slug}`);
    revalidatePath(`/${restaurant.slug}/menu`);
    revalidatePath(`/${restaurant.slug}/orders`);

    return { success: true, restaurant };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro ao atualizar taxa de entrega.' };
  }
};
