"use client";

import { Button } from "@/components/ui/button";
import { ScrollBar } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/helpers/format-currency";
import { Prisma } from "@prisma/client";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { ChefHatIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface ProductDetailsProps {
  product: Prisma.ProductGetPayload<{
    //Vai no banco, nesta variável product inclui nela restaurant do banco,
    //Seleciona dela o name e o avatarImageUrl
    include: {
      restaurant: {
        select: {
          name: true;
          avatarImageUrl: true;
        };
      };
    };
  }>;
}

const ProductDetails = ({ product }: ProductDetailsProps) => {
  const [quantity, setQuantity] = useState<number>(1);

  const handleDecreaseQuantity = () => {
    setQuantity((prev) => {
      if (prev === 1) {
        return 1;
      } else {
        return prev - 1;
      }
    });
  };

  const handleIncreaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  return (
    <div className="relative z-50 rounded-t-3xl p-5 mt-[-1.5rem] flex flex-auto flex-col overflow-hidden">
      <div className="flex-auto overflow-hidden">
        <div className="flex items-center gap-1.5">
          <Image
            src={product.restaurant.avatarImageUrl}
            alt={product.restaurant.name}
            width={20}
            height={20}
            className="rounded-full"
          />

          <p className="text-sm text-muted-foreground">
            {product.restaurant.name}
          </p>
        </div>

        <h2 className="mt-3 text-xl font-semibold">{product.name}</h2>

        <div className="flex items-center justify-between mb-4 mt-2">
          <h3 className="text-xl font-semibold">
            {formatCurrency(product.price)}
          </h3>
          <div className="flex items-center gap-3 text-center">
            <Button
              variant="outline"
              className="h-8 w-8 rounded-xl"
              onClick={handleDecreaseQuantity}
            >
              <ChevronLeftIcon />
            </Button>

            <p className="w-4">{quantity}</p>

            <Button
              variant="destructive"
              className="h-8 w-8 rounded-xl"
              onClick={handleIncreaseQuantity}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-full overflow-y-auto">
          <div className="mt-3 space-y-3">
            <h4 className="font-semibold">Sobre</h4>
            <p className="text-sm text-muted-foreground">
              {product.description}
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-1.5 ">
              <ChefHatIcon size={18} />
              <h4 className="font-semibold">Ingredientes</h4>
            </div>

            <ul className="list-disc px-7 flex flex-col gap-0.5 text-sm text-muted-foreground">
              {product.ingredients.map((ingredient) => (
                <li key={ingredient}>{ingredient}</li>
              ))}
            </ul>
          </div>
        </ScrollArea>
      </div>
      <Button className="rounded-full w-full z-50">
        Adicionar ao carrinho
      </Button>
    </div>
  );
};

export default ProductDetails;
