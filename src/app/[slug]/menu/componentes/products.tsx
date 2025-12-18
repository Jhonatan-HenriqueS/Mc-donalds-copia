import { Product } from "@prisma/client";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";

interface ProductsProps {
  products: Product[];
}

const Products = ({ products }: ProductsProps) => {
  const { slug } = useParams<{ slug: string }>();
  //Memsa coisa que usar params na interface

  return (
    <div className="space-y-3 px-5 py-3">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/${slug}/menu/${product.id}`}
          className="flex items-center justify-between gap-10 py-3 border-b "
        >
          <div>
            <h3 className="text-sm font-medium">{product.name}</h3>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {/* Vai ocupar no máximo 2 linhas */}
              {product.description}
            </p>
            <p className="pt-3 text-sm font-semibold">
              {new Intl.NumberFormat("pt-BR", {
                //Está função tranforma meu preço em Reais automaticamente
                style: "currency",
                currency: "BRL",
              }).format(product.price)}
            </p>
          </div>
          <div className="relative min-h-[90px] min-w-[130px]">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="rounded-lg object-contain"
            />
          </div>
        </Link>
      ))}
    </div>
  );
};

export default Products;
