-- DropForeignKey
ALTER TABLE "ParticipacaoSorteio" DROP CONSTRAINT "ParticipacaoSorteio_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "ParticipacaoSorteio" DROP CONSTRAINT "ParticipacaoSorteio_sorteioId_fkey";

-- AddForeignKey
ALTER TABLE "ParticipacaoSorteio" ADD CONSTRAINT "ParticipacaoSorteio_sorteioId_fkey" FOREIGN KEY ("sorteioId") REFERENCES "Sorteio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipacaoSorteio" ADD CONSTRAINT "ParticipacaoSorteio_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
