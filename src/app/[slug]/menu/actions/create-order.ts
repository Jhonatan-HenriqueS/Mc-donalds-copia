//Vai usar server e client (back e front)
'use server';

import { ConsumptionMethod, OrderStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import { db } from '@/lib/prisma';

import { removeCpfPunctuation } from '../helpers/cpf';

interface createOrderInput {
  customerName: string;
  customerCpf: string;
  customerEmail: string;
  customerPhone: string;
  products: Array<{
    id: string;
    price: number;
    quantity: number;
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
    throw new Error('Restaurant not Found!');
  }
  const productsWithPrices = await db.product.findMany({
    where: {
      id: {
        in: input.products.map((products) => products.id),
        //Busca todos os produtos existentes pelo seu id
      },
    },
  });

  const productsWithPricesQuantities = input.products.map((product) => ({
    productId: product.id,
    quantity: product.quantity,
    price: productsWithPrices.find((p) => p.id === product.id)!.price,
  }));

  const baseOrderData = {
    status: 'PENDING' as OrderStatus,
    customerName: input.customerName,
    customerCpf: removeCpfPunctuation(input.customerCpf),
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    orderProducts: {
      createMany: {
        data: productsWithPricesQuantities,
      },
    },
    total: productsWithPricesQuantities.reduce(
      (acc, product) => acc + product.price * product.quantity,
      0
    ),
    consumptionMethod: input.consumptionMethod,
    restaurantId: restaurant.id,
  };

  // Criar dados da ordem com campos de endereço se for TAKEANAY
  if (
    input.consumptionMethod === 'TAKEANAY' &&
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
