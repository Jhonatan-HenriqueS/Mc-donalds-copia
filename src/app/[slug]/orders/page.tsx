import { db } from '@/lib/prisma';

import { isValidCpf, removeCpfPunctuation } from '../menu/helpers/cpf';
import CpfForm from './componentes/cpf-form';
import OrderListWrapper from './componentes/order-list-wrapper';

interface OrdersPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cpf: string }>;
}

const OrdersPage = async ({ params, searchParams }: OrdersPageProps) => {
  const { slug } = await params;
  const { cpf } = await searchParams;

  if (!cpf) {
    const restaurant = await db.restaurant.findUnique({
      where: { slug },
      select: { id: true },
    });
    return <CpfForm restaurantId={restaurant?.id} />;
  }

  if (!isValidCpf(cpf)) {
    const restaurant = await db.restaurant.findUnique({
      where: { slug },
      select: { id: true },
    });
    return <CpfForm restaurantId={restaurant?.id} />;
  }

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
    return <CpfForm restaurantId={undefined} />;
  }

  const orders = await db.order.findMany({
    orderBy: {
      createdAt: 'desc',
      //Mostra o mais recente do banco primeiro
    },
    //Busca no banco por ordem do cpf informado E do restaurante atual
    where: {
      customerCpf: removeCpfPunctuation(cpf),
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
      cpf={removeCpfPunctuation(cpf)}
    />
  );
};

export default OrdersPage;
