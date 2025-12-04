
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function test() {
    const email = 'test@example.com';
    const password = 'password';

    try {
        console.log('Connecting to Prisma...');
        const user = await prisma.user.findUnique({ where: { email } });
        console.log('User found:', user);

        if (!user) {
            console.log('User not found');
            return;
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        console.log('Password valid:', validPassword);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
