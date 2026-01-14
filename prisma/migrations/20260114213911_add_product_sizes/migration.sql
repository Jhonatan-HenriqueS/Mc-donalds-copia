-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "sizeName" TEXT,
ADD COLUMN     "sizePrice" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "OrderProduct" ADD COLUMN     "sizeId" TEXT,
ADD COLUMN     "sizeName" TEXT,
ADD COLUMN     "sizePrice" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "ProductSize" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSize_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProductSize" ADD CONSTRAINT "ProductSize_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
