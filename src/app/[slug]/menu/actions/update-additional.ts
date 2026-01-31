"use server";

import { revalidatePath } from "next/cache";

import { verifyRestaurantOwner } from "@/app/actions/session";
import { db } from "@/lib/prisma";

interface UpdateAdditionalInput {
  restaurantId: string;
  additionalId: string;
  name?: string;
  price?: number;
  imageUrl?: string | null;
}

export const updateAdditional = async (input: UpdateAdditionalInput) => {
  try {
    const isOwner = await verifyRestaurantOwner(input.restaurantId);
    if (!isOwner) {
      return {
        success: false,
        error: "Acesso negado. Você não tem permissão para editar adicionais.",
      };
    }

    const additional = await db.categoryAdditional.findUnique({
      where: { id: input.additionalId },
      select: {
        menuCategory: {
          select: { restaurantId: true, restaurant: { select: { slug: true } } },
        },
      },
    });

    if (
      !additional ||
      additional.menuCategory.restaurantId !== input.restaurantId
    ) {
      return {
        success: false,
        error: "Adicional não encontrado.",
      };
    }

    const updated = await db.categoryAdditional.update({
      where: { id: input.additionalId },
      data: {
        name: input.name,
        price: input.price,
        imageUrl:
          input.imageUrl === undefined
            ? undefined
            : input.imageUrl || null,
      },
    });

    const slug = additional.menuCategory.restaurant?.slug;
    if (slug) {
      revalidatePath(`/${slug}/menu`);
    }

    return { success: true, additional: updated };
  } catch (error) {
    console.error("Erro ao atualizar adicional:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao atualizar adicional",
    };
  }
};
