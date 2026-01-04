-- Deletar restaurantes sem userId (restaurantes antigos sem usuário associado)
DELETE FROM "Restaurant" WHERE "userId" IS NULL;

-- Agora tornar o campo obrigatório
ALTER TABLE "Restaurant" ALTER COLUMN "userId" SET NOT NULL;
