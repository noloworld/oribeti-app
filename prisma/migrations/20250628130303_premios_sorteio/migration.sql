-- CreateTable
CREATE TABLE "PremioSorteio" (
    "id" SERIAL NOT NULL,
    "sorteioId" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "PremioSorteio_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PremioSorteio" ADD CONSTRAINT "PremioSorteio_sorteioId_fkey" FOREIGN KEY ("sorteioId") REFERENCES "Sorteio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
