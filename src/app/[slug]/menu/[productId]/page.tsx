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
          paymentMethods: true,
          contactPhone: true,
          addressStreet: true,
          addressNumber: true,
          addressNeighborhood: true,
          addressCity: true,
          addressState: true,
          addressZipCode: true,
          addressReference: true,
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
    <div className="flex h-[100dvh] flex-col overflow-y-auto no-scrollbar">
      <ProductHeader product={product} />
      <ProductDetails product={product} />
    </div>
  );
};

export default ProductPage;
