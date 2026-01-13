// Server action to update which consumption methods a restaurant accepts
'use server';

import { revalidatePath } from 'next/cache';

import { verifyRestaurantOwner } from '@/app/actions/session';
import { db } from '@/lib/prisma';

interface UpdateConsumptionMethodsInput {
  restaurantId: string;
  allowDineIn: boolean;
  allowTakeaway: boolean;
}

export const updateConsumptionMethods = async (
  input: UpdateConsumptionMethodsInput
) => {
  try {
    const isOwner = await verifyRestaurantOwner(input.restaurantId);

    if (!isOwner) {
      return {
        success: false,
        error:
          'Acesso negado. Você não tem permissão para alterar métodos de consumo.',
      };
    }

    if (!input.allowDineIn && !input.allowTakeaway) {
      return {
        success: false,
        error: 'Selecione ao menos um método de consumo.',
      };
    }

    const restaurant = await db.restaurant.update({
      where: { id: input.restaurantId },
      data: {
        allowDineIn: input.allowDineIn,
        allowTakeaway: input.allowTakeaway,
      },
      select: {
        slug: true,
        allowDineIn: true,
        allowTakeaway: true,
      },
    });

    revalidatePath(`/${restaurant.slug}`);
    revalidatePath(`/${restaurant.slug}/menu`);

    return { success: true, restaurant };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'Erro ao atualizar métodos de consumo.',
    };
  }
};
