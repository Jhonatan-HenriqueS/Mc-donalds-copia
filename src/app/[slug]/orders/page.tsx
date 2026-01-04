import { db } from '@/lib/prisma';

import { isValidCpf, removeCpfPunctuation } from '../menu/helpers/cpf';
import CpfForm from './componentes/cpf-form';
import OrderList from './componentes/orders';

interface OrdersPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cpf: string }>;
}

const OrdersPage = async ({ params, searchParams }: OrdersPageProps) => {
  const { slug } = await params;
  const { cpf } = await searchParams;

  if (!cpf) {
    return <CpfForm />;
  }

  if (!isValidCpf(cpf)) {
    return <CpfForm />;
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
    return <CpfForm />;
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
        },
      },
    },
  });
  return <OrderList orders={orders} />;
};

export default OrdersPage;
