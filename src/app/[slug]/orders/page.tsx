import { db } from "@/lib/prisma";
import { isValidCpf, removeCpfPunctuation } from "../menu/helpers/cpf";
import CpfForm from "./componentes/cpf-form";
import OrderList from "./componentes/orders";

interface OrdersPageProps {
  searchParams: Promise<{ cpf: string }>;
}

const OrdersPage = async ({ searchParams }: OrdersPageProps) => {
  const { cpf } = await searchParams;

  if (!cpf) {
    return <CpfForm />;
  }

  if (!isValidCpf(cpf)) {
    return <CpfForm />;
  }

  const orders = await db.order.findMany({
    //Preocura no banco por ordem do cpf informado
    where: {
      customerCpf: removeCpfPunctuation(cpf),
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
