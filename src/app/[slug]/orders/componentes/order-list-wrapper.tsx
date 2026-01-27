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
  email: string;
}

const OrderListWrapper = ({
  orders,
  restaurantId,
  email,
}: OrderListWrapperProps) => {
  const { markAsSeen } = useCustomerOrderNotifications({
    restaurantId,
    email,
    orders: orders.map((order) => ({
      id: order.id,
      status: order.status,
      updateAt: order.updateAt,
    })),
    enabled: true,
  });

  // Salvar email no localStorage e marcar como visto quando os pedidos forem exibidos
  useEffect(() => {
    if (orders.length > 0 && email) {
      localStorage.setItem(`last_order_email_${restaurantId}`, email);
      // Marcar como visto após um pequeno delay para garantir que o componente foi renderizado
      const timer = setTimeout(() => {
        markAsSeen();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [orders.length, email, restaurantId, markAsSeen]);

  return <OrderList orders={orders} />;
};

export default OrderListWrapper;
