"use server";

import { revalidatePath } from "next/cache";

import { verifyRestaurantOwner } from "@/app/actions/session";
import { db } from "@/lib/prisma";

interface CreateRequiredAdditionalItemInput {
  restaurantId: string;
  groupId: string;
  name: string;
  imageUrl?: string;
}

export const createRequiredAdditionalItem = async (
  input: CreateRequiredAdditionalItemInput
) => {
  try {
    const isOwner = await verifyRestaurantOwner(input.restaurantId);
    if (!isOwner) {
      return {
        success: false,
        error:
          "Acesso negado. Você não tem permissão para criar itens obrigatórios.",
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

    const item = await db.requiredAdditionalItem.create({
      data: {
        name: input.name,
        imageUrl: input.imageUrl ?? null,
        groupId: input.groupId,
      },
    });

    const slug = group.menuCategory.restaurant?.slug;
    if (slug) {
      revalidatePath(`/${slug}/menu`);
    }

    return { success: true, item };
  } catch (error) {
    console.error("Erro ao criar item obrigatório:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao criar item obrigatório",
    };
  }
};
