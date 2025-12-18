"use client";

import { Button } from "@/components/ui/button";
import { Product } from "@prisma/client";
import { ChevronLeftIcon, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface ProductHeaderProps {
  product: Pick<Product, "name" | "imageUrl">;
}

const ProductHeader = ({ product }: ProductHeaderProps) => {
  const router = useRouter();
  const handleBackClick = () => router.back();
  //Diz pra bibliotecas de rotas do react para voltar a página anterior

  return (
    <div>
      <div className="relative w-full min-h-[300px]">
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 left-4 rounded-full z-50"
          onClick={handleBackClick}
        >
          <ChevronLeftIcon />
        </Button>
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-contain"
        />
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 right-4 rounded-full z-50"
        >
          <ShoppingCart />
        </Button>
      </div>
    </div>
  );
};

export default ProductHeader;
