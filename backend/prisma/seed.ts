import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@example.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            password_hash: hashedPassword,
            full_name: 'Admin User',
            role: 'admin',
            is_active: true,
            email_verified: true
        },
    });

    console.log({ user });

    const categories = ['General', 'HR', 'Payroll', 'Benefits'];

    for (const name of categories) {
        await prisma.category.upsert({
            where: { name },
            update: {},
            create: { name, description: `${name} related questions` }
        });
    }

    console.log('Categories seeded');
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
