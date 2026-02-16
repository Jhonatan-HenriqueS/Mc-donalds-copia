-- Add optional restaurant information fields used in admin settings and checkout
ALTER TABLE "Restaurant"
ADD COLUMN "contactPhone" TEXT,
ADD COLUMN "addressStreet" TEXT,
ADD COLUMN "addressNumber" TEXT,
ADD COLUMN "addressNeighborhood" TEXT,
ADD COLUMN "addressCity" TEXT,
ADD COLUMN "addressState" TEXT,
ADD COLUMN "addressZipCode" TEXT,
ADD COLUMN "addressReference" TEXT;
