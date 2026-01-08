'use client';

import { useEffect, useState } from 'react';

interface UseOrderNotificationsProps {
  restaurantId: string;
  currentOrderCount?: number;
  currentOrderIds?: number[];
  enabled?: boolean;
}

interface UseCustomerOrderNotificationsProps {
  restaurantId: string;
  cpf?: string;
  orders?: Array<{
    id: number;
    status: string;
    updateAt: Date;
  }>;
  enabled?: boolean;
}

// Hook para notificações do admin
export const useOrderNotifications = ({
  restaurantId,
  currentOrderCount = 0,
  currentOrderIds = [],
  enabled = true,
}: UseOrderNotificationsProps) => {
  const [newOrderCount, setNewOrderCount] = useState(0);
  const storageKey = `admin_last_seen_order_${restaurantId}`;

  useEffect(() => {
    if (!enabled) return;

    // Buscar último número de pedidos visto
    const lastSeenCount = localStorage.getItem(storageKey);
    const lastSeenIds = localStorage.getItem(`${storageKey}_ids`);

    if (lastSeenCount) {
      const parsedLastSeen = parseInt(lastSeenCount, 10);
      const parsedLastSeenIds = lastSeenIds
        ? JSON.parse(lastSeenIds)
        : [];

      // Calcular pedidos novos
      const newIds = currentOrderIds.filter(
        (id) => !parsedLastSeenIds.includes(id)
      );

      setNewOrderCount(newIds.length);
    } else {
      // Primeira vez - considerar todos como novos até marcar como visto
      setNewOrderCount(currentOrderIds.length);
    }
  }, [restaurantId, currentOrderCount, currentOrderIds, storageKey, enabled]);

  const markAsSeen = () => {
    localStorage.setItem(storageKey, currentOrderCount.toString());
    localStorage.setItem(
      `${storageKey}_ids`,
      JSON.stringify(currentOrderIds)
    );
    setNewOrderCount(0);
  };

  return {
    newOrderCount,
    markAsSeen,
    hasNewOrders: newOrderCount > 0,
  };
};

// Hook para notificações do cliente
export const useCustomerOrderNotifications = ({
  restaurantId,
  cpf,
  orders = [],
  enabled = true,
}: UseCustomerOrderNotificationsProps) => {
  const [hasStatusChanged, setHasStatusChanged] = useState(false);
  const storageKey = cpf
    ? `customer_last_status_${restaurantId}_${cpf}`
    : null;

  // Criar uma string serializada dos pedidos para usar como dependência
  const ordersSignature = orders
    .map((order) => `${order.id}:${order.status}:${order.updateAt.getTime()}`)
    .join('|');

  useEffect(() => {
    if (!enabled || !storageKey || !cpf || orders.length === 0) {
      setHasStatusChanged(false);
      return;
    }

    // Buscar último status visto
    const lastSeenData = localStorage.getItem(storageKey);

    if (lastSeenData) {
      try {
        const parsed = JSON.parse(lastSeenData);
        const lastSeenStatuses = parsed.statuses || {};
        const lastSeenUpdateAt = parsed.lastUpdateAt
          ? new Date(parsed.lastUpdateAt)
          : null;

        // Verificar se algum pedido teve mudança de status
        const hasChanged = orders.some((order) => {
          const orderUpdateAt = new Date(order.updateAt);
          const lastSeenStatus = lastSeenStatuses[order.id];

          // Se não viu este pedido antes, ou se o status mudou, ou se foi atualizado após última visualização
          return (
            !lastSeenStatus ||
            lastSeenStatus !== order.status ||
            (lastSeenUpdateAt && orderUpdateAt > lastSeenUpdateAt)
          );
        });

        setHasStatusChanged(hasChanged);
      } catch (error) {
        console.error('Erro ao verificar status:', error);
        // Se houver erro, considerar como mudança para garantir que o cliente veja
        setHasStatusChanged(true);
      }
    } else {
      // Primeira vez - considerar como mudança
      setHasStatusChanged(true);
    }
  }, [restaurantId, cpf, ordersSignature, storageKey, enabled, orders]);

  const markAsSeen = () => {
    if (!storageKey || !cpf || orders.length === 0) return;

    // Salvar status atual de todos os pedidos
    const statuses: Record<number, string> = {};
    let maxUpdateAt: Date | null = null;

    orders.forEach((order) => {
      statuses[order.id] = order.status;
      const orderUpdateAt = new Date(order.updateAt);
      if (!maxUpdateAt || orderUpdateAt > maxUpdateAt) {
        maxUpdateAt = orderUpdateAt;
      }
    });

    localStorage.setItem(
      storageKey,
      JSON.stringify({
        statuses,
        lastUpdateAt: maxUpdateAt?.toISOString() || new Date().toISOString(),
      })
    );

    setHasStatusChanged(false);
  };

  return {
    hasStatusChanged,
    markAsSeen,
  };
};
