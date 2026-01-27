//Usando separado para usar rotas

"use client";

import { Restaurant } from "@prisma/client";
import { ChevronLeftIcon, ScrollTextIcon } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import { useCustomerOrderNotifications } from "../hooks/use-order-notifications";

interface RestaurantHeaderProps {
  restaurant: Pick<Restaurant, "id" | "name" | "coverImageUrl">;
  //Pick pega todas, mas eu seleciono a especifica
}

interface OrderFromApi {
  id: number;
  status: string;
  updateAt: string | Date;
}

const RestaurantHeader = ({ restaurant }: RestaurantHeaderProps) => {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const handleBackClick = () => router.back();
  const handleOrdersClick = () => router.push(`/${slug}/orders`);

  // Buscar email do localStorage se existir algum pedido
  const [email, setEmail] = useState<string | null>(null);
  const [orders, setOrders] = useState<
    Array<{
      id: number;
      status: string;
      updateAt: Date;
    }>
  >([]);

  // Buscar email salvo do último pedido feito
  useEffect(() => {
    const savedEmail = localStorage.getItem(
      `last_order_email_${restaurant.id}`
    );
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, [restaurant.id]);

  // Buscar pedidos do cliente quando tiver email
  useEffect(() => {
    if (!email) {
      setOrders([]);
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch(
          `/api/customer-orders?restaurantId=${restaurant.id}&email=${encodeURIComponent(
            email
          )}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.orders) {
            setOrders(
              (data.orders as OrderFromApi[]).map((order) => ({
                id: order.id,
                status: order.status,
                updateAt: new Date(order.updateAt),
              }))
            );
          }
        }
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
      }
    };

    fetchOrders();

    // Verificar a cada 30 segundos
    const interval = setInterval(fetchOrders, 30000);

    return () => clearInterval(interval);
  }, [email, restaurant.id]);

  const { hasStatusChanged } = useCustomerOrderNotifications({
    restaurantId: restaurant.id,
    email: email || undefined,
    orders,
    enabled: !!email,
  });

  return (
    <div className="relative h-[250px] w-full">
      <Button
        variant="secondary"
        size="icon"
        className="absolute top-4 left-4 rounded-full z-50"
        onClick={handleBackClick}
        //Diz pra bibliotecas de rotas do react para voltar a página anterior
      >
        <ChevronLeftIcon />
      </Button>
      <Image
        src={restaurant.coverImageUrl}
        alt={restaurant.name}
        fill
        className="object-cover"
      />
      <Button
        variant="secondary"
        size="icon"
        className="absolute top-4 right-4 rounded-full z-50 "
        onClick={handleOrdersClick}
      >
        <ScrollTextIcon />
        {hasStatusChanged && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white">
            !
          </span>
        )}
      </Button>
    </div>
  );
};

export default RestaurantHeader;
