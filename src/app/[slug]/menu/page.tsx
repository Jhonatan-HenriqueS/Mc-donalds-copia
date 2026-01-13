import { notFound } from "next/navigation";

import { db } from "@/lib/prisma";

import RestaurantCategories from "./componentes/categories";
import RestaurantHeader from "./componentes/header";

interface RestaurantMenuPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ consumptionMethod: string }>;
}

const isConsumptionMethodValid = (consumptionMethod: string) => {
  //A pagina só sera acesada caso houver um dos 2 no link
  if (!consumptionMethod) return false;
  return ["DINE_IN", "TAKEANAY"].includes(consumptionMethod.toUpperCase());
};

const RestaurantMenuPage = async ({
  params,
  searchParams,
}: RestaurantMenuPageProps) => {
  const { slug } = await params;

  const { consumptionMethod } = await searchParams;
  const normalizedMethod = consumptionMethod?.toUpperCase();
  const restaurant = await db.restaurant.findUnique({
    where: { slug },
    include: {
      //Vai trazer todas as categorias deste restaurante
      menuCategorias: {
        //Vai pegar todas categorias e seus produtos
        include: { products: true },
      },
    },
  });

  if (!isConsumptionMethodValid(normalizedMethod || "")) {
    return notFound();
  }

  if (!restaurant) {
    return notFound();
  }

  // Defaults to true to keep legacy restaurants accessible
  const allowDineIn = restaurant.allowDineIn ?? true;
  const allowTakeaway = restaurant.allowTakeaway ?? true;

  if (
    (normalizedMethod === "DINE_IN" && !allowDineIn) ||
    (normalizedMethod === "TAKEANAY" && !allowTakeaway)
  ) {
    return notFound();
  }

  return (
    <div>
      <RestaurantHeader restaurant={restaurant} />
      <RestaurantCategories restaurant={restaurant} />
    </div>
  );
};

export default RestaurantMenuPage;
