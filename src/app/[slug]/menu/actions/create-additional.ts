"use server";

import { revalidatePath } from "next/cache";

import { verifyRestaurantOwner } from "@/app/actions/session";
import { db } from "@/lib/prisma";

interface CreateAdditionalInput {
  restaurantId: string;
  menuCategoryId: string;
  name: string;
  price: number;
  imageUrl?: string;
}

export const createAdditional = async (input: CreateAdditionalInput) => {
  try {
    const isOwner = await verifyRestaurantOwner(input.restaurantId);
    if (!isOwner) {
      return {
        success: false,
        error: "Acesso negado. Você não tem permissão para criar adicionais.",
      };
    }

    const category = await db.menuCategory.findUnique({
      where: { id: input.menuCategoryId },
      select: {
        restaurantId: true,
        restaurant: {
          select: { slug: true },
        },
      },
    });

    if (!category || category.restaurantId !== input.restaurantId) {
      return {
        success: false,
        error: "Categoria não encontrada ou não pertence ao restaurante.",
      };
    }

    const additional = await db.categoryAdditional.create({
      data: {
        name: input.name,
        price: input.price,
        imageUrl: input.imageUrl ?? null,
        menuCategoryId: input.menuCategoryId,
      },
    });

    if (category.restaurant?.slug) {
      revalidatePath(`/${category.restaurant.slug}/menu`);
    }

    return { success: true, additional };
  } catch (error) {
    console.error("Erro ao criar adicional:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao criar adicional",
    };
  }
};
