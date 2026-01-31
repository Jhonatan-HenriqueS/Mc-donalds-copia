"use server";

import { revalidatePath } from "next/cache";

import { verifyRestaurantOwner } from "@/app/actions/session";
import { db } from "@/lib/prisma";

interface UpdateRequiredAdditionalItemInput {
  restaurantId: string;
  itemId: string;
  name: string;
  imageUrl?: string | null;
}

export const updateRequiredAdditionalItem = async (
  input: UpdateRequiredAdditionalItemInput
) => {
  try {
    const isOwner = await verifyRestaurantOwner(input.restaurantId);
    if (!isOwner) {
      return {
        success: false,
        error:
          "Acesso negado. Você não tem permissão para editar itens obrigatórios.",
      };
    }

    const item = await db.requiredAdditionalItem.findUnique({
      where: { id: input.itemId },
      select: {
        group: {
          select: {
            menuCategory: {
              select: {
                restaurantId: true,
                restaurant: { select: { slug: true } },
              },
            },
          },
        },
      },
    });

    if (
      !item ||
      item.group.menuCategory.restaurantId !== input.restaurantId
    ) {
      return {
        success: false,
        error: "Item não encontrado.",
      };
    }

    const updated = await db.requiredAdditionalItem.update({
      where: { id: input.itemId },
      data: {
        name: input.name,
        imageUrl:
          input.imageUrl === undefined
            ? undefined
            : input.imageUrl || null,
      },
    });

    const slug = item.group.menuCategory.restaurant?.slug;
    if (slug) {
      revalidatePath(`/${slug}/menu`);
    }

    return { success: true, item: updated };
  } catch (error) {
    console.error("Erro ao atualizar item obrigatório:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao atualizar item obrigatório",
    };
  }
};
