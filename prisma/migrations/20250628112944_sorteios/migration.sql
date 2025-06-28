-- CreateTable
CREATE TABLE "Sorteio" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "numeroVencedor" INTEGER,
    "vencedorId" INTEGER,
    "encerrado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Sorteio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipacaoSorteio" (
    "id" SERIAL NOT NULL,
    "sorteioId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParticipacaoSorteio_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ParticipacaoSorteio" ADD CONSTRAINT "ParticipacaoSorteio_sorteioId_fkey" FOREIGN KEY ("sorteioId") REFERENCES "Sorteio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipacaoSorteio" ADD CONSTRAINT "ParticipacaoSorteio_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
