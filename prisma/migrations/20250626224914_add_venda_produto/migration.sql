/*
  Warnings:

  - You are about to drop the column `nomeProduto` on the `Venda` table. All the data in the column will be lost.
  - You are about to drop the column `valorFinal` on the `Venda` table. All the data in the column will be lost.
  - You are about to drop the column `valorRevista` on the `Venda` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Venda" DROP COLUMN "nomeProduto",
DROP COLUMN "valorFinal",
DROP COLUMN "valorRevista";

-- CreateTable
CREATE TABLE "VendaProduto" (
    "id" SERIAL NOT NULL,
    "vendaId" INTEGER NOT NULL,
    "nomeProduto" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "valorRevista" DOUBLE PRECISION NOT NULL,
    "valorFinal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "VendaProduto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VendaProduto" ADD CONSTRAINT "VendaProduto_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES "Venda"("id") ON DELETE CASCADE ON UPDATE CASCADE;
