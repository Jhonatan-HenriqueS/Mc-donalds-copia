//Vai usar server e client (back e front)
"use server";

import { ConsumptionMethod, OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/prisma";

interface createOrderInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  products: Array<{
    id: string;
    price: number;
    quantity: number;
    sizeId?: string | null;
    additionals?: Array<{
      id?: string;
      name: string;
      price: number;
      quantity: number;
    }>;
    requiredAdditionals?: Array<{
      id?: string;
      name: string;
      groupId: string;
      groupTitle: string;
      quantity: number;
    }>;
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
      menuCategory: {
        include: {
          additionals: true,
          requiredAdditionalGroups: {
            include: {
              items: true,
            },
          },
        },
      },
    },
  });

  const productsWithPricesQuantities = input.products.map((product) => {
    const dbProduct = productsWithPrices.find((p) => p.id === product.id);
    const selectedSize = dbProduct?.sizes.find((s) => s.id === product.sizeId);

    const basePrice = dbProduct?.price ?? product.price ?? 0;
    const sizePrice = selectedSize?.price ?? null;
    const unitPrice = sizePrice ?? basePrice;
    const sizeExtra = sizePrice ? sizePrice - basePrice : 0;

    const additionals =
      product.additionals
        ?.map((additional) => {
          const dbAdditional = dbProduct?.menuCategory.additionals.find(
            (item) => item.id === additional.id
          );
          if (!dbAdditional) {
            return null;
          }
          return {
            name: dbAdditional.name,
            price: dbAdditional.price,
            quantity: additional.quantity ?? 0,
            categoryAdditionalId: dbAdditional.id,
          };
        })
        .filter(
          (
            item
          ): item is {
            name: string;
            price: number;
            quantity: number;
            categoryAdditionalId: string;
          } => !!item && item.quantity > 0
        ) || [];

    const additionalsUnitTotal = additionals.reduce(
      (acc, current) => acc + current.price * current.quantity,
      0
    );

    const requiredGroups = dbProduct?.menuCategory.requiredAdditionalGroups || [];
    const requiredSelections =
      product.requiredAdditionals
        ?.map((required) => {
          const group = requiredGroups.find(
            (item) => item.id === required.groupId
          );
          const item = group?.items.find((option) => option.id === required.id);
          if (!group || !item) {
            return null;
          }
          return {
            name: item.name,
            groupTitle: group.title,
            quantity: required.quantity ?? 0,
            requiredAdditionalItemId: item.id,
            groupId: group.id,
          };
        })
        .filter(
          (
            item
          ): item is {
            name: string;
            groupTitle: string;
            quantity: number;
            requiredAdditionalItemId: string;
            groupId: string;
          } => !!item && item.quantity > 0
        ) || [];

    const requiredCounts = requiredSelections.reduce(
      (acc, item) => {
        acc[item.groupId] = (acc[item.groupId] || 0) + item.quantity;
        return acc;
      },
      {} as Record<string, number>
    );

    const missingRequired = requiredGroups.some(
      (group) => (requiredCounts[group.id] || 0) < group.requiredQuantity
    );

    const exceededRequired = requiredGroups.some(
      (group) => (requiredCounts[group.id] || 0) > group.requiredQuantity
    );

    if (missingRequired) {
      throw new Error(
        "Seleção obrigatória incompleta. Verifique os adicionais obrigatórios."
      );
    }
    if (exceededRequired) {
      throw new Error(
        "Seleção obrigatória acima do limite. Ajuste os adicionais obrigatórios."
      );
    }

    return {
      productId: product.id,
      quantity: product.quantity,
      price: unitPrice,
      basePrice,
      sizeExtra,
      sizeId: product.sizeId,
      sizeName: selectedSize?.name || null,
      sizePrice,
      additionals,
      additionalsUnitTotal,
      requiredAdditionals: requiredSelections,
    };
  });

  const productsSubtotal = productsWithPricesQuantities.reduce(
    (acc, product) => acc + product.basePrice * product.quantity,
    0
  );

  const sizesSubtotal = productsWithPricesQuantities.reduce(
    (acc, product) => acc + product.sizeExtra * product.quantity,
    0
  );

  const additionalsSubtotal = productsWithPricesQuantities.reduce(
    (acc, product) => acc + product.additionalsUnitTotal * product.quantity,
    0
  );
  const subtotal =
    productsSubtotal + sizesSubtotal + additionalsSubtotal;
  const deliveryFee =
    input.consumptionMethod === "TAKEANAY" ? (restaurant.deliveryFee ?? 0) : 0;

  const baseOrderData = {
    status: "PENDING" as OrderStatus,
    customerName: input.customerName,
    customerCpf: "SEM_CPF",
    customerEmail: input.customerEmail.trim().toLowerCase(),
    customerPhone: input.customerPhone,
    orderProducts: {
      create: productsWithPricesQuantities.map((p) => ({
        productId: p.productId,
        quantity: p.quantity,
        price: p.price,
        basePrice: p.basePrice,
        sizeId: p.sizeId || null,
        sizeName: p.sizeName || null,
        sizePrice: p.sizePrice || null,
        additionals: p.additionals.length
          ? {
              create: p.additionals.map((additional) => ({
                name: additional.name,
                price: additional.price,
                quantity: additional.quantity,
                categoryAdditionalId: additional.categoryAdditionalId,
              })),
            }
          : undefined,
        requiredAdditionals: p.requiredAdditionals.length
          ? {
              create: p.requiredAdditionals.map((required) => ({
                name: required.name,
                groupTitle: required.groupTitle,
                quantity: required.quantity,
                requiredAdditionalItemId: required.requiredAdditionalItemId,
              })),
            }
          : undefined,
      })),
    },
    total: subtotal + deliveryFee,
    productsSubtotal,
    sizesSubtotal,
    additionalsSubtotal,
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
  // redirect(`/${input.slug}/orders?email=${input.customerEmail}`);
  return order;
};
