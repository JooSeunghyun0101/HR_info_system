import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin() {
    try {
        const user = await prisma.user.update({
            where: { email: 'admin@example.com' },
            data: { role: 'admin' }
        });

        console.log('✅ Admin 권한 설정 완료!');
        console.log(`   이메일: ${user.email}`);
        console.log(`   이름: ${user.full_name}`);
        console.log(`   역할: ${user.role}`);

        await prisma.$disconnect();
    } catch (error: any) {
        if (error.code === 'P2025') {
            console.error('❌ admin@example.com 계정을 찾을 수 없습니다.');
        } else {
            console.error('❌ 오류:', error);
        }
        await prisma.$disconnect();
        process.exit(1);
    }
}

makeAdmin();
