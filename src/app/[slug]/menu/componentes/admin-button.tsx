'use client';

import { Prisma } from '@prisma/client';
import { Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

import AdminSheet from './admin-sheet';

interface AdminButtonProps {
  restaurant: Prisma.RestaurantGetPayload<{
    include: {
      menuCategorias: true;
    };
  }>;
}

const AdminButton = ({ restaurant }: AdminButtonProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
          className="rounded-full"
          onClick={() => setIsAdminOpen(true)}
        >
          <Settings className="h-4 w-4" />
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
