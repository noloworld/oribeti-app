-- AlterTable
ALTER TABLE "Venda" ADD COLUMN     "observacoes" TEXT,
ADD COLUMN     "valorPago" DOUBLE PRECISION NOT NULL DEFAULT 0;
