import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import RestaurantHeader from "./componentes/header";
import RestaurantCategories from "./componentes/categories";

interface RestaurantMenuPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ consumptionMethod: string }>;
}

const isConsumptionMethodValid = (consumptionMethod: string) => {
  //A pagina só sera acesada caso houver um dos 2 no link
  return ["DINE_IN", "TAKEANAY"].includes(consumptionMethod.toUpperCase());
};

const RestaurantMenuPage = async ({
  params,
  searchParams,
}: RestaurantMenuPageProps) => {
  const { slug } = await params;

  const { consumptionMethod } = await searchParams;
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

  if (!isConsumptionMethodValid(consumptionMethod)) {
    return notFound();
  }

  if (!restaurant) {
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
