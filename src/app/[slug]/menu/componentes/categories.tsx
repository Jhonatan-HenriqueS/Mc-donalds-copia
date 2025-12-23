"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Prisma } from "@prisma/client";
import { ClockIcon, ScrollTextIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
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

  const handlesCategoryClick = (category: MenuCategoriesMithProducts) => {
    setSelectedCategory(category);
  };

  const getCategoryButtonVariant = (category: MenuCategoriesMithProducts) => {
    return selectedCategory.id === category.id ? "default" : "secondary";
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

          <div className="absolute right-4">
            <Button variant="secondary" className="bg-slate-100 rounded-full">
              <ScrollTextIcon />
            </Button>
          </div>

          <div></div>
        </div>

        <div className="flex items-center mt-3 gap-1 text-xs text-green-500">
          <ClockIcon size={12} />
          <p>Aberto!</p>
        </div>
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
      <h2 className="py-2.5 pl-8 font-semibold ">{selectedCategory.name}</h2>
      <Products products={selectedCategory.products} />
    </div>
  );
};

export default RestaurantCategories;
