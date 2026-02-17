'use client';

import { Prisma } from '@prisma/client';
import { Info, Phone, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getOrdersCount } from '@/app/[slug]/menu/actions/get-orders-count';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

import { useOrderNotifications } from '../hooks/use-order-notifications';
import AdminSheet from './admin-sheet';

interface AdminButtonProps {
  restaurant: Prisma.RestaurantGetPayload<{
    include: {
      paymentMethods: true;
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
  const [isInfoOpen, setIsInfoOpen] = useState(false);
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

  const hasAnyInfo = Boolean(
    restaurant.contactPhone ||
      restaurant.addressStreet ||
      restaurant.addressNumber ||
      restaurant.addressNeighborhood ||
      restaurant.addressCity ||
      restaurant.addressState ||
      restaurant.addressZipCode ||
      restaurant.addressReference,
  );
  const addressLine = [restaurant.addressStreet, restaurant.addressNumber]
    .filter(Boolean)
    .join(', ');
  const whatsappDigits = (restaurant.contactPhone || '').replace(/\D/g, '');
  const hasWhatsappNumber = whatsappDigits.length >= 10;
  const whatsappNumber =
    whatsappDigits.length === 10 || whatsappDigits.length === 11
      ? `55${whatsappDigits}`
      : whatsappDigits;
  const whatsappLink = hasWhatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        'Olá, preciso de ajuda!',
      )}`
    : null;

  return (
    <>
      <div className="absolute right-4">
        {isAuthenticated ? (
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
        ) : (
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full"
            onClick={() => setIsInfoOpen(true)}
          >
            <Info className="h-4 w-4" />
          </Button>
        )}
      </div>
      {isAuthenticated ? (
        <AdminSheet
          isOpen={isAdminOpen}
          onOpenChange={setIsAdminOpen}
          restaurant={restaurant}
        />
      ) : (
        <AlertDialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
          <AlertDialogContent className="w-[90%] max-w-md rounded-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>Informações do restaurante</AlertDialogTitle>
              <AlertDialogDescription>
                Veja os dados cadastrados para contato e localização.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {hasAnyInfo ? (
              <div className="space-y-1 text-sm text-muted-foreground">
                {addressLine && (
                  <p className="font-medium text-foreground">{addressLine}</p>
                )}
                {restaurant.addressNeighborhood && (
                  <p>{restaurant.addressNeighborhood}</p>
                )}
                {(restaurant.addressCity || restaurant.addressState) && (
                  <p>
                    {restaurant.addressCity}
                    {restaurant.addressCity && restaurant.addressState
                      ? '/'
                      : ''}
                    {restaurant.addressState}
                  </p>
                )}
                {restaurant.addressZipCode && (
                  <p>CEP: {restaurant.addressZipCode}</p>
                )}
                {restaurant.addressReference && (
                  <p>Referência: {restaurant.addressReference}</p>
                )}
                {restaurant.contactPhone && (
                  <p>Telefone: {restaurant.contactPhone}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                O restaurante ainda não cadastrou informações.
              </p>
            )}

            {whatsappLink && (
              <Button asChild className="w-full">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <Phone className="mr-2 h-4 w-4" />
                  Falar no WhatsApp
                </a>
              </Button>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel>Fechar</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

export default AdminButton;
