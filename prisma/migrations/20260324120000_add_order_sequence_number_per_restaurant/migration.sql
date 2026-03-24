ALTER TABLE "Order"
ADD COLUMN "sequenceNumber" INTEGER;

WITH ordered_orders AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "restaurantId"
      ORDER BY "createdAt" ASC, id ASC
    ) AS sequence_number
  FROM "Order"
)
UPDATE "Order" AS "order"
SET "sequenceNumber" = ordered_orders.sequence_number
FROM ordered_orders
WHERE "order".id = ordered_orders.id;

ALTER TABLE "Order"
ALTER COLUMN "sequenceNumber" SET NOT NULL;

CREATE UNIQUE INDEX "Order_restaurantId_sequenceNumber_key"
ON "Order"("restaurantId", "sequenceNumber");
