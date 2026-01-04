import { Product } from '@prisma/client';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';

import { formatCurrency } from '@/helpers/format-currency';

interface ProductsProps {
  products: Product[];
}

const Products = ({ products }: ProductsProps) => {
  const { slug } = useParams<{ slug: string }>();
  //Memsa coisa que usar params na interface

  const searchParams = useSearchParams();
  //Pega a URL e insere ela nesta const

  const consumptionMethod = searchParams.get('consumptionMethod');
  //Manipulo para pegar o consumptionMethod da URL

  return (
    <div className="space-y-3 px-5 pt-2 pb-3">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/${slug}/menu/${product.id}?consumptionMethod=${consumptionMethod}`}
          className="flex items-center justify-between gap-10 py-3 border-b "
        >
          <div>
            <h3 className="text-sm font-medium">{product.name}</h3>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {/* Vai ocupar no máximo 2 linhas */}
              {product.description}
            </p>
            <p className="pt-3 text-sm font-semibold">
              {formatCurrency(product.price)}
            </p>
          </div>
          <div className="relative min-h-[85px] min-w-[120px]">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="rounded-lg object-cover"
            />
          </div>
        </Link>
      ))}
    </div>
  );
};

export default Products;
