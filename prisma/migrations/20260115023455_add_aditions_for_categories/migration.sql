-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "additionalsSubtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "productsSubtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "sizesSubtotal" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderProduct" ADD COLUMN     "basePrice" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CategoryAdditional" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "menuCategoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryAdditional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderProductAdditional" (
    "id" TEXT NOT NULL,
    "orderProductId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "categoryAdditionalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderProductAdditional_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CategoryAdditional" ADD CONSTRAINT "CategoryAdditional_menuCategoryId_fkey" FOREIGN KEY ("menuCategoryId") REFERENCES "MenuCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderProductAdditional" ADD CONSTRAINT "OrderProductAdditional_orderProductId_fkey" FOREIGN KEY ("orderProductId") REFERENCES "OrderProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderProductAdditional" ADD CONSTRAINT "OrderProductAdditional_categoryAdditionalId_fkey" FOREIGN KEY ("categoryAdditionalId") REFERENCES "CategoryAdditional"("id") ON DELETE SET NULL ON UPDATE CASCADE;
