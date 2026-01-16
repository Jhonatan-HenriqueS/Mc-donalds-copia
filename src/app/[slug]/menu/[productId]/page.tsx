import { notFound } from "next/navigation";

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
          isOpen: true,
          deliveryFee: true,
        },
      },
      sizes: true,
      menuCategory: {
        select: {
          id: true,
          name: true,
          additionals: true,
          requiredAdditionalGroups: {
            include: {
              items: true,
            },
          },
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
    <div className="flex h-full flex-col ">
      <ProductHeader product={product} />
      <ProductDetails product={product} />
    </div>
  );
};

export default ProductPage;
