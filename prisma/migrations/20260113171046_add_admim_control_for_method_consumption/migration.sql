/*
  Warnings:

  - The values [PAYMENT_CONFIRMED,PAYMENT_FAILED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'IN_PREPARATION', 'FINISHED', 'OUT_FOR_DELIVERY');
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "allowDineIn" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowTakeaway" BOOLEAN NOT NULL DEFAULT true;
