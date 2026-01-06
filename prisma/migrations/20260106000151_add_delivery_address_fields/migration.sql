-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryCity" TEXT,
ADD COLUMN     "deliveryComplement" TEXT,
ADD COLUMN     "deliveryNeighborhood" TEXT,
ADD COLUMN     "deliveryNumber" TEXT,
ADD COLUMN     "deliveryState" TEXT,
ADD COLUMN     "deliveryStreet" TEXT,
ADD COLUMN     "deliveryZipCode" TEXT;

-- DropEnum
DROP TYPE "SubscriptionType";
