"use server";

import { revalidatePath } from "next/cache";

import { verifyRestaurantOwner } from "@/app/actions/session";
import { db } from "@/lib/prisma";

export const deleteRequiredAdditionalItem = async (
  itemId: string,
  restaurantId: string
) => {
  try {
    const isOwner = await verifyRestaurantOwner(restaurantId);
    if (!isOwner) {
      return {
        success: false,
        error:
          "Acesso negado. Você não tem permissão para excluir itens obrigatórios.",
      };
    }

    const item = await db.requiredAdditionalItem.findUnique({
      where: { id: itemId },
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
      item.group.menuCategory.restaurantId !== restaurantId
    ) {
      return {
        success: false,
        error: "Item não encontrado.",
      };
    }

    await db.requiredAdditionalItem.delete({
      where: { id: itemId },
    });

    const slug = item.group.menuCategory.restaurant?.slug;
    if (slug) {
      revalidatePath(`/${slug}/menu`);
    }

    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir item obrigatório:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao excluir item obrigatório",
    };
  }
};
