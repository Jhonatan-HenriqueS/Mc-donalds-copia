'use client';

import { Prisma } from '@prisma/client';
import { useEffect } from 'react';

import { useCustomerOrderNotifications } from '../../menu/hooks/use-order-notifications';
import OrderList from './orders';

interface OrderListWrapperProps {
  orders: Array<
    Prisma.OrderGetPayload<{
      include: {
        restaurant: {
          select: {
            name: true;
            avatarImageUrl: true;
          };
        };
        orderProducts: {
          include: {
            product: true;
            additionals: true;
            requiredAdditionals: true;
          };
        };
      };
    }>
  >;
  restaurantId: string;
  cpf: string;
}

const OrderListWrapper = ({
  orders,
  restaurantId,
  cpf,
}: OrderListWrapperProps) => {
  const { markAsSeen } = useCustomerOrderNotifications({
    restaurantId,
    cpf,
    orders: orders.map((order) => ({
      id: order.id,
      status: order.status,
      updateAt: order.updateAt,
    })),
    enabled: true,
  });

  // Salvar CPF no localStorage e marcar como visto quando os pedidos forem exibidos
  useEffect(() => {
    if (orders.length > 0 && cpf) {
      localStorage.setItem(`last_order_cpf_${restaurantId}`, cpf);
      // Marcar como visto após um pequeno delay para garantir que o componente foi renderizado
      const timer = setTimeout(() => {
        markAsSeen();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [orders.length, cpf, restaurantId, markAsSeen]);

  return <OrderList orders={orders} />;
};

export default OrderListWrapper;
