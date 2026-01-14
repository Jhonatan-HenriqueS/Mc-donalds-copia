// Server action to update restaurant open/closed status
'use server';

import { revalidatePath } from 'next/cache';

import { verifyRestaurantOwner } from '@/app/actions/session';
import { db } from '@/lib/prisma';

interface UpdateRestaurantStatusInput {
  restaurantId: string;
  isOpen: boolean;
}

export const updateRestaurantStatus = async (
  input: UpdateRestaurantStatusInput
) => {
  try {
    const isOwner = await verifyRestaurantOwner(input.restaurantId);

    if (!isOwner) {
      return {
        success: false,
        error: 'Acesso negado. Você não tem permissão para alterar o status.',
      };
    }

    const restaurant = await db.restaurant.update({
      where: { id: input.restaurantId },
      data: { isOpen: input.isOpen },
      select: { slug: true, isOpen: true },
    });

    revalidatePath(`/${restaurant.slug}`);
    revalidatePath(`/${restaurant.slug}/menu`);
    revalidatePath(`/${restaurant.slug}/orders`);

    return { success: true, restaurant };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro ao atualizar status.' };
  }
};
