-- CreateTable
CREATE TABLE "ProdutoDespesa" (
    "id" SERIAL NOT NULL,
    "despesaId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "preco" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ProdutoDespesa_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProdutoDespesa" ADD CONSTRAINT "ProdutoDespesa_despesaId_fkey" FOREIGN KEY ("despesaId") REFERENCES "Despesa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
