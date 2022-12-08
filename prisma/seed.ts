import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);
  // SEED THE ADMIN
  if ((await prisma.user.count({ where: { role: 'ADMIN' } })) < 1) {
    await prisma.user.create({
      data: {
        names: 'Brian Gitego',
        email: 'admin@nestpay.rw',
        password: bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10),
        username: 'admin',
        role: 'ADMIN',
      },
    });
  }
  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
