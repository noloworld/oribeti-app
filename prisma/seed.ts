import { PrismaClient } from '../src/generated/prisma';
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
  console.log('Usuário admin criado!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect()); 