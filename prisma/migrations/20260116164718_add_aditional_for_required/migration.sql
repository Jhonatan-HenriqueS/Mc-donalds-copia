-- CreateTable
CREATE TABLE "RequiredAdditionalGroup" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "requiredQuantity" INTEGER NOT NULL,
    "menuCategoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequiredAdditionalGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequiredAdditionalItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequiredAdditionalItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderProductRequiredAdditional" (
    "id" TEXT NOT NULL,
    "orderProductId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "groupTitle" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "requiredAdditionalItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderProductRequiredAdditional_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RequiredAdditionalGroup" ADD CONSTRAINT "RequiredAdditionalGroup_menuCategoryId_fkey" FOREIGN KEY ("menuCategoryId") REFERENCES "MenuCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequiredAdditionalItem" ADD CONSTRAINT "RequiredAdditionalItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "RequiredAdditionalGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderProductRequiredAdditional" ADD CONSTRAINT "OrderProductRequiredAdditional_orderProductId_fkey" FOREIGN KEY ("orderProductId") REFERENCES "OrderProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderProductRequiredAdditional" ADD CONSTRAINT "OrderProductRequiredAdditional_requiredAdditionalItemId_fkey" FOREIGN KEY ("requiredAdditionalItemId") REFERENCES "RequiredAdditionalItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
