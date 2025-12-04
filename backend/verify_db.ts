import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
    try {
        console.log('Testing database connection...');

        // Test connection
        await prisma.$connect();
        console.log('✅ Database connected');

        // Check admin user
        const admin = await prisma.user.findUnique({
            where: { email: 'admin@example.com' }
        });

        if (admin) {
            console.log('✅ Admin user exists');
            console.log('   Email:', admin.email);
            console.log('   Role:', admin.role);
            console.log('   Active:', admin.is_active);
        } else {
            console.log('❌ Admin user NOT found');
        }

        // Check categories
        const categories = await prisma.category.findMany();
        console.log(`✅ Found ${categories.length} categories`);
        categories.forEach(cat => console.log(`   - ${cat.name}`));

        // Check Q&A entries  
        const qnas = await prisma.qnAEntry.findMany({
            where: { is_deleted: false }
        });
        console.log(`✅ Found ${qnas.length} Q&A entries`);

        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

test();
