//Usando separado para usar rotas

"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ShoppingCart } from "lucide-react";
import { Restaurant } from "@prisma/client";
import { useRouter } from "next/navigation";

interface RestaurantHeaderProps {
  restaurant: Pick<Restaurant, "name" | "coverImageUrl">;
  //Pick pega todas, mas eu seleciono a especifica
}

const RestaurantHeader = ({ restaurant }: RestaurantHeaderProps) => {
  const router = useRouter();
  const handleBackClick = () => router.back();

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
        className="absolute top-4 right-4 rounded-full z-50"
      >
        <ShoppingCart />
      </Button>
    </div>
  );
};

export default RestaurantHeader;
