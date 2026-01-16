'use client';

import { Prisma } from '@prisma/client';
import { Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getOrdersCount } from '@/app/[slug]/menu/actions/get-orders-count';
import { Button } from '@/components/ui/button';

import { useOrderNotifications } from '../hooks/use-order-notifications';
import AdminSheet from './admin-sheet';

interface AdminButtonProps {
  restaurant: Prisma.RestaurantGetPayload<{
    include: {
      menuCategorias: {
        include: {
          products: true;
          additionals: true;
          requiredAdditionalGroups: { include: { items: true } };
        };
      };
    };
  }>;
}

const AdminButton = ({ restaurant }: AdminButtonProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orderCount, setOrderCount] = useState(0);
  const [orderIds, setOrderIds] = useState<number[]>([]);

  const { newOrderCount, markAsSeen, hasNewOrders } = useOrderNotifications({
    restaurantId: restaurant.id,
    currentOrderCount: orderCount,
    currentOrderIds: orderIds,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar se o usuário está autenticado e é dono do restaurante
        const response = await fetch(
          `/api/check-admin?restaurantId=${restaurant.id}`
        );
        const data = await response.json();
        setIsAuthenticated(data.isOwner || false);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [restaurant.id]);

  // Buscar contador de pedidos periodicamente
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchOrderCount = async () => {
      try {
        const result = await getOrdersCount(restaurant.id);
        if (result.success) {
          setOrderCount(result.count);
          setOrderIds(result.orderIds);
        }
      } catch (error) {
        console.error('Erro ao buscar contador de pedidos:', error);
      }
    };

    // Buscar imediatamente
    fetchOrderCount();

    // Buscar a cada 30 segundos
    const interval = setInterval(fetchOrderCount, 30000);

    return () => clearInterval(interval);
  }, [restaurant.id, isAuthenticated]);

  const handleAdminClick = () => {
    markAsSeen();
    setIsAdminOpen(true);
  };

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <div className="absolute right-4">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full relative"
          onClick={handleAdminClick}
        >
          <Settings className="h-4 w-4" />
          {hasNewOrders && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {newOrderCount > 9 ? '9+' : newOrderCount}
            </span>
          )}
        </Button>
      </div>
      <AdminSheet
        isOpen={isAdminOpen}
        onOpenChange={setIsAdminOpen}
        restaurant={restaurant}
      />
    </>
  );
};

export default AdminButton;
