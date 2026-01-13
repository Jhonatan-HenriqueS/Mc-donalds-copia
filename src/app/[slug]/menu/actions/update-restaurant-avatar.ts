// Server action to update restaurant avatar (logo)
'use server';

import { revalidatePath } from 'next/cache';

import { verifyRestaurantOwner } from '@/app/actions/session';
import { db } from '@/lib/prisma';

interface UpdateRestaurantAvatarInput {
  restaurantId: string;
  avatarImageUrl: string;
}

export const updateRestaurantAvatar = async (
  input: UpdateRestaurantAvatarInput
) => {
  try {
    const isOwner = await verifyRestaurantOwner(input.restaurantId);

    if (!isOwner) {
      return {
        success: false,
        error: 'Acesso negado. Você não tem permissão para alterar o logo.',
      };
    }

    if (!input.avatarImageUrl.trim()) {
      return {
        success: false,
        error: 'A imagem do logo é obrigatória.',
      };
    }

    const restaurant = await db.restaurant.update({
      where: { id: input.restaurantId },
      data: {
        avatarImageUrl: input.avatarImageUrl.trim(),
      },
      select: {
        slug: true,
        avatarImageUrl: true,
      },
    });

    revalidatePath(`/${restaurant.slug}`);
    revalidatePath(`/${restaurant.slug}/menu`);

    return { success: true, restaurant };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro ao atualizar logo.' };
  }
};
