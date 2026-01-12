
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import dns from 'node:dns';
try {
    dns.setDefaultResultOrder('ipv4first');
} catch (e) {
    console.log('Node version too old for dns.setDefaultResultOrder, ignoring.');
}

const prisma = new PrismaClient();

async function main() {
    console.log('Connecting to database...');
    try {
        const users = await prisma.user.findMany({ take: 1 });
        console.log('Successfully connected to database.');
        console.log('Found users:', users);
    } catch (error) {
        console.error('Error connecting to database:', error);
        if (error instanceof Error) {
            console.error('Error stack:', error.stack);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
