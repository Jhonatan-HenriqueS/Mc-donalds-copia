import { db } from '@/lib/prisma';

import EmailForm from './componentes/cpf-form';
import OrderListWrapper from './componentes/order-list-wrapper';

interface OrdersPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ email: string }>;
}

const OrdersPage = async ({ params, searchParams }: OrdersPageProps) => {
  const { slug } = await params;
  const { email } = await searchParams;

  if (!email) {
    const restaurant = await db.restaurant.findUnique({
      where: { slug },
      select: { id: true },
    });
    return <EmailForm restaurantId={restaurant?.id} />;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Buscar o restaurante pelo slug para garantir que estamos no restaurante correto
  const restaurant = await db.restaurant.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
    },
  });

  if (!restaurant) {
    return <EmailForm restaurantId={undefined} />;
  }

  const orders = await db.order.findMany({
    orderBy: {
      createdAt: 'desc',
      //Mostra o mais recente do banco primeiro
    },
    //Busca no banco por ordem do email informado E do restaurante atual
    where: {
      customerEmail: {
        equals: normalizedEmail,
        mode: 'insensitive',
      },
      restaurantId: restaurant.id, // Filtra apenas pedidos deste restaurante
    },
    include: {
      restaurant: {
        select: {
          name: true,
          avatarImageUrl: true,
        },
      },
      orderProducts: {
        //vai pergar todos os produtos
        include: {
          product: true,
          additionals: true,
          requiredAdditionals: true,
        },
      },
    },
  });
  return (
    <OrderListWrapper
      orders={orders}
      restaurantId={restaurant.id}
      email={normalizedEmail}
    />
  );
};

export default OrdersPage;
