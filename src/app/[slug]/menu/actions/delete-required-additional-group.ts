"use server";

import { revalidatePath } from "next/cache";

import { verifyRestaurantOwner } from "@/app/actions/session";
import { db } from "@/lib/prisma";

export const deleteRequiredAdditionalGroup = async (
  groupId: string,
  restaurantId: string
) => {
  try {
    const isOwner = await verifyRestaurantOwner(restaurantId);
    if (!isOwner) {
      return {
        success: false,
        error:
          "Acesso negado. Você não tem permissão para excluir adicionais obrigatórios.",
      };
    }

    const group = await db.requiredAdditionalGroup.findUnique({
      where: { id: groupId },
      select: {
        menuCategory: {
          select: { restaurantId: true, restaurant: { select: { slug: true } } },
        },
      },
    });

    if (!group || group.menuCategory.restaurantId !== restaurantId) {
      return {
        success: false,
        error: "Grupo não encontrado.",
      };
    }

    await db.requiredAdditionalGroup.delete({
      where: { id: groupId },
    });

    const slug = group.menuCategory.restaurant?.slug;
    if (slug) {
      revalidatePath(`/${slug}/menu`);
    }

    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir adicional obrigatório:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao excluir adicional obrigatório",
    };
  }
};
