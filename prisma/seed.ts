import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@email.com' },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@email.com',
      senha: senhaHash,
      tipo: 'ADMIN',
    },
  });

  // Criar utilizador apresentador
  const apresentadorHash = await bcrypt.hash('apresentador123', 10);
  await prisma.user.upsert({
    where: { email: 'apresentador@oribeti.com' },
    update: {},
    create: {
      nome: 'Apresentador Demo',
      email: 'apresentador@oribeti.com',
      senha: apresentadorHash,
      tipo: 'APRESENTADOR',
    },
  });

  console.log('Utilizadores criados com sucesso!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect()); 