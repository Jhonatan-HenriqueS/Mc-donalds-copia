//Vai usar server e client (back e front)
"use server";

import { ConsumptionMethod, OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/prisma";

import { removeCpfPunctuation } from "../helpers/cpf";

interface createOrderInput {
  customerName: string;
  customerCpf: string;
  customerEmail: string;
  customerPhone: string;
  products: Array<{
    id: string;
    price: number;
    quantity: number;
    sizeId?: string | null;
  }>;
  consumptionMethod: ConsumptionMethod;
  slug: string;
  deliveryStreet?: string;
  deliveryNumber?: string;
  deliveryComplement?: string;
  deliveryNeighborhood?: string;
  deliveryCity?: string;
  deliveryState?: string;
}

export const createOrder = async (input: createOrderInput) => {
  const restaurant = await db.restaurant.findUnique({
    where: {
      slug: input.slug,
    },
  });

  if (!restaurant) {
    throw new Error("Restaurant not Found!");
  }
  const productsWithPrices = await db.product.findMany({
    where: {
      id: {
        in: input.products.map((products) => products.id),
        //Busca todos os produtos existentes pelo seu id
      },
    },
    include: {
      sizes: true,
    },
  });

  const productsWithPricesQuantities = input.products.map((product) => {
    const dbProduct = productsWithPrices.find((p) => p.id === product.id);
    const selectedSize = dbProduct?.sizes.find((s) => s.id === product.sizeId);

    const priceToUse =
      selectedSize?.price ?? product.price ?? dbProduct?.price ?? 0;

    return {
      productId: product.id,
      quantity: product.quantity,
      price: priceToUse,
      sizeId: product.sizeId,
      sizeName: selectedSize?.name || null,
      sizePrice: selectedSize?.price || null,
    };
  });

  const subtotal = productsWithPricesQuantities.reduce(
    (acc, product) => acc + product.price * product.quantity,
    0
  );
  const deliveryFee =
    input.consumptionMethod === "TAKEANAY" ? (restaurant.deliveryFee ?? 0) : 0;

  const baseOrderData = {
    status: "PENDING" as OrderStatus,
    customerName: input.customerName,
    customerCpf: removeCpfPunctuation(input.customerCpf),
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    orderProducts: {
      createMany: {
        data: productsWithPricesQuantities.map((p) => ({
          productId: p.productId,
          quantity: p.quantity,
          price: p.price,
          sizeId: p.sizeId || null,
          sizeName: p.sizeName || null,
          sizePrice: p.sizePrice || null,
        })),
      },
    },
    total: subtotal + deliveryFee,
    deliveryFee,
    consumptionMethod: input.consumptionMethod,
    restaurantId: restaurant.id,
  };

  // Criar dados da ordem com campos de endereço se for TAKEANAY
  if (
    input.consumptionMethod === "TAKEANAY" &&
    input.deliveryStreet &&
    input.deliveryNumber &&
    input.deliveryNeighborhood &&
    input.deliveryCity &&
    input.deliveryState
  ) {
    const order = await db.order.create({
      data: {
        ...baseOrderData,
        deliveryStreet: input.deliveryStreet,
        deliveryNumber: input.deliveryNumber,
        deliveryComplement: input.deliveryComplement || null,
        deliveryNeighborhood: input.deliveryNeighborhood,
        deliveryCity: input.deliveryCity,
        deliveryState: input.deliveryState,
      },
    });
    revalidatePath(`/${input.slug}/orders`);
    return order;
  }

  const order = await db.order.create({
    data: baseOrderData,
  });
  revalidatePath(`/${input.slug}/orders`); //Sempre esse pedido vai ser guardado no servidor
  // redirect(
  //   `/${input.slug}/orders?cpf=${removeCpfPunctuation(input.customerCpf)}`
  // );
  return order;
};
