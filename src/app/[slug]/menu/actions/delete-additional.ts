"use server";

import { revalidatePath } from "next/cache";

import { verifyRestaurantOwner } from "@/app/actions/session";
import { db } from "@/lib/prisma";

export const deleteAdditional = async (
  additionalId: string,
  restaurantId: string
) => {
  try {
    const isOwner = await verifyRestaurantOwner(restaurantId);
    if (!isOwner) {
      return {
        success: false,
        error: "Acesso negado. Você não tem permissão para excluir adicionais.",
      };
    }

    const additional = await db.categoryAdditional.findUnique({
      where: { id: additionalId },
      select: {
        menuCategory: {
          select: { restaurantId: true, restaurant: { select: { slug: true } } },
        },
      },
    });

    if (
      !additional ||
      additional.menuCategory.restaurantId !== restaurantId
    ) {
      return {
        success: false,
        error: "Adicional não encontrado.",
      };
    }

    await db.categoryAdditional.delete({
      where: { id: additionalId },
    });

    const slug = additional.menuCategory.restaurant?.slug;
    if (slug) {
      revalidatePath(`/${slug}/menu`);
    }

    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir adicional:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao excluir adicional",
    };
  }
};
