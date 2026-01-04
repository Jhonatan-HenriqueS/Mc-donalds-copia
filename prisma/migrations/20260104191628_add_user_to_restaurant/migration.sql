-- AlterTable
-- Primeiro adicionar como opcional
ALTER TABLE "Restaurant" ADD COLUMN "userId" TEXT;

-- Deletar restaurantes existentes sem usuário (ou você pode atualizar manualmente)
-- DELETE FROM "Restaurant" WHERE "userId" IS NULL;

-- Agora tornar obrigatório (descomente se deletou os restaurantes acima)
-- ALTER TABLE "Restaurant" ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
