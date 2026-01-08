import { notFound } from "next/navigation";

import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from "@/lib/prisma";

import ProductHeader from "./componentes/header";
import ProductDetails from "./componentes/product-details";

interface ProductPageProps {
  params: Promise<{ slug: string; productId: string }>;
}

const ProductPage = async ({ params }: ProductPageProps) => {
  const { slug, productId } = await params;
  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      restaurant: {
        select: {
          name: true,
          avatarImageUrl: true,
          slug: true,
        },
      },
    },
  });

  if (!product) {
    return notFound();
  }

  if (product.restaurant.slug.toUpperCase() != slug.toUpperCase()) {
    return notFound();
  }
  return (
    <ScrollArea className="h-full overflow-y-auto pb-4">
      <div className="flex h-full flex-col">
        <ProductHeader product={product} />
        <ProductDetails product={product} />
      </div>
    </ScrollArea>
  );
};

export default ProductPage;
