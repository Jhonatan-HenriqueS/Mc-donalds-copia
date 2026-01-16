"use server";

import { revalidatePath } from "next/cache";

import { verifyRestaurantOwner } from "@/app/actions/session";
import { db } from "@/lib/prisma";

interface UpdateRequiredAdditionalGroupInput {
  restaurantId: string;
  groupId: string;
  title: string;
  requiredQuantity: number;
}

export const updateRequiredAdditionalGroup = async (
  input: UpdateRequiredAdditionalGroupInput
) => {
  try {
    const isOwner = await verifyRestaurantOwner(input.restaurantId);
    if (!isOwner) {
      return {
        success: false,
        error:
          "Acesso negado. Você não tem permissão para editar adicionais obrigatórios.",
      };
    }

    const group = await db.requiredAdditionalGroup.findUnique({
      where: { id: input.groupId },
      select: {
        menuCategory: {
          select: { restaurantId: true, restaurant: { select: { slug: true } } },
        },
      },
    });

    if (!group || group.menuCategory.restaurantId !== input.restaurantId) {
      return {
        success: false,
        error: "Grupo não encontrado.",
      };
    }

    const updated = await db.requiredAdditionalGroup.update({
      where: { id: input.groupId },
      data: {
        title: input.title,
        requiredQuantity: input.requiredQuantity,
      },
    });

    const slug = group.menuCategory.restaurant?.slug;
    if (slug) {
      revalidatePath(`/${slug}/menu`);
    }

    return { success: true, group: updated };
  } catch (error) {
    console.error("Erro ao atualizar adicional obrigatório:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao atualizar adicional obrigatório",
    };
  }
};
