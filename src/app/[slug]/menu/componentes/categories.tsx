"use client";

import { Prisma } from "@prisma/client";
import { ClockIcon } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useContext, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/helpers/format-currency";

import { CartContext } from "../context/cart";
import AdminButton from "./admin-button";
import CartSheet from "./cart-sheet";
import Products from "./products";

interface RestaurantsCategoriesProps {
  restaurant: Prisma.RestaurantGetPayload<{
    //Pega o restaurant
    include: {
      menuCategorias: {
        //Pega o menuCategorias
        include: { products: true };
        //E pega os produtos do menu de acordo com sua categoria
      };
    };
  }>;
}

type MenuCategoriesMithProducts = Prisma.MenuCategoryGetPayload<{
  include: { products: true };
}>;

const RestaurantCategories = ({ restaurant }: RestaurantsCategoriesProps) => {
  const [selectedCategory, setSelectedCategory] =
    useState<MenuCategoriesMithProducts>(restaurant.menuCategorias[0]);
  //Assim que entra no site o primeiro a aparecer é a primeira categoria

  const { products, total, taggleCart, totalQuantity } =
    useContext(CartContext);
  const searchParams = useSearchParams();
  const isTakeaway = useMemo(
    () => (searchParams.get("consumptionMethod") || "").toUpperCase() === "TAKEANAY",
    [searchParams]
  );

  const handlesCategoryClick = (category: MenuCategoriesMithProducts) => {
    setSelectedCategory(category);
  };

  const getCategoryButtonVariant = (category: MenuCategoriesMithProducts) => {
    return selectedCategory?.id === category.id ? "default" : "secondary";
    // Navariant caso o botão específico estiver selecionado ele se tranforma ao inverso do que era
  };

  return (
    <div className="relative z-50 mt-[-1.5rem] rounded-t-3xl bg-white ">
      <div className="p-5">
        <div className="flex items-center gap-3 ">
          <Image
            src={restaurant.avatarImageUrl}
            alt={restaurant.name}
            height={45}
            width={45}
          />
          <div>
            <h2 className="font-semibold text-lg">{restaurant.name}</h2>
            <p className="text-xs opacity-55">{restaurant.description}</p>
          </div>

          <AdminButton restaurant={restaurant} />

          <div></div>
        </div>

        <div className="flex items-center mt-3 gap-1 text-xs">
          <ClockIcon size={12} />
          <p className={restaurant.isOpen ? "text-green-500" : "text-red-500"}>
            {restaurant.isOpen ? "Aberto!" : "Fechado!"}
          </p>
        </div>
        {isTakeaway && (
          <p className="text-xs text-muted-foreground mt-1">
            Taxa de entrega:{" "}
            <span className="text-red-500">
              {formatCurrency(restaurant.deliveryFee ?? 0)}
            </span>
          </p>
        )}
      </div>

      <ScrollArea className="w-full ">
        <div className="flex w-max space-x-4 p-4 pt-0">
          {restaurant.menuCategorias.map((category) => (
            <Button
              onClick={() => handlesCategoryClick(category)}
              key={category.id}
              variant={getCategoryButtonVariant(category)}
              size="sm"
              className="rounded-full"
            >
              {category.name}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="hidden"></ScrollBar>
      </ScrollArea>
      <h2 className="py-2.5 pl-8 font-semibold ">{selectedCategory?.name}</h2>

      {selectedCategory?.products.length === 0 && (
        <div className="flex items-center justify-center py-10">
          <p className="text-sm text-muted-foreground">
            Nenhum produto encontrado
          </p>
        </div>
      )}
      <div className={`${products.length > 0 ? "pb-14" : ""}`}>
        <Products products={selectedCategory?.products || []} />
      </div>

      {products.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 flex w-full items-center justify-between border-t bg-white px-5 py-3">
          <div>
            <p className="text-ms text-muted-foreground">Total do pedido</p>
            <p className="text-sm font-semibold">
              {formatCurrency(
                isTakeaway ? total + (restaurant.deliveryFee ?? 0) : total
              )}
              <span className="text-xs font-normal text-muted-foreground ">
                /{totalQuantity}
                {totalQuantity > 1 ? " itens" : " item"}
              </span>
            </p>
            <CartSheet
              isRestaurantOpen={restaurant.isOpen ?? true}
              isTakeaway={isTakeaway}
              deliveryFee={restaurant.deliveryFee ?? 0}
            />
          </div>
          <Button onClick={taggleCart}>Ver Pedidos</Button>
        </div>
      )}
    </div>
  );
};

export default RestaurantCategories;
