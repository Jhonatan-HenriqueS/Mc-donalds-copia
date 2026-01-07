'use server';

import type { OrderStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import { verifyRestaurantOwner } from '@/app/actions/session';
import { db } from '@/lib/prisma';

export const updateOrderStatus = async (
  orderId: number,
  restaurantId: string,
  newStatus: OrderStatus
) => {
  try {
    // Verificar se o usuário está autenticado e é dono do restaurante
    const isOwner = await verifyRestaurantOwner(restaurantId);
    if (!isOwner) {
      return {
        success: false,
        error: 'Acesso negado. Você não tem permissão para atualizar pedidos.',
      };
    }

    // Verificar se o pedido existe e pertence ao restaurante
    const order = await db.order.findUnique({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      return {
        success: false,
        error: 'Pedido não encontrado',
      };
    }

    if (order.restaurantId !== restaurantId) {
      return {
        success: false,
        error: 'Pedido não pertence a este restaurante',
      };
    }

    // Validar se o status OUT_FOR_DELIVERY só pode ser usado para pedidos TAKEANAY
    if (newStatus === 'OUT_FOR_DELIVERY' && order.consumptionMethod !== 'TAKEANAY') {
      return {
        success: false,
        error: 'Status "Enviado para entrega" só pode ser usado para pedidos de entrega',
      };
    }

    // Atualizar status do pedido
    const updatedOrder = await db.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: newStatus,
      },
    });

    // Revalidar a página do menu e pedidos
    const restaurant = await db.restaurant.findUnique({
      where: { id: restaurantId },
      select: { slug: true },
    });

    if (restaurant) {
      revalidatePath(`/${restaurant.slug}/menu`);
      revalidatePath(`/${restaurant.slug}/orders`);
    }

    return { success: true, order: updatedOrder };
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro ao atualizar status do pedido' };
  }
};

