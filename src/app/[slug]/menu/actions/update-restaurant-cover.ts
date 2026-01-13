// Server action to update restaurant cover image
'use server';

import { revalidatePath } from 'next/cache';

import { verifyRestaurantOwner } from '@/app/actions/session';
import { db } from '@/lib/prisma';

interface UpdateRestaurantCoverInput {
  restaurantId: string;
  coverImageUrl: string;
}

export const updateRestaurantCover = async (
  input: UpdateRestaurantCoverInput
) => {
  try {
    const isOwner = await verifyRestaurantOwner(input.restaurantId);

    if (!isOwner) {
      return {
        success: false,
        error: 'Acesso negado. Você não tem permissão para alterar a capa.',
      };
    }

    if (!input.coverImageUrl.trim()) {
      return {
        success: false,
        error: 'A imagem de capa é obrigatória.',
      };
    }

    const restaurant = await db.restaurant.findUnique({
      where: { id: input.restaurantId },
      select: { slug: true },
    });

    if (!restaurant) {
      return { success: false, error: 'Restaurante não encontrado.' };
    }

    const updated = await db.restaurant.update({
      where: { id: input.restaurantId },
      data: { coverImageUrl: input.coverImageUrl.trim() },
      select: { slug: true, coverImageUrl: true },
    });

    revalidatePath(`/${restaurant.slug}`);
    revalidatePath(`/${restaurant.slug}/menu`);
    revalidatePath(`/${restaurant.slug}/orders`);

    return { success: true, restaurant: updated };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro ao atualizar capa.' };
  }
};
