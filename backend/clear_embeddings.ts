import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAllEmbeddings() {
    try {
        console.log('기존 임베딩 삭제 중...');

        await prisma.$executeRaw`UPDATE qna_entries SET embedding = NULL`;
        await prisma.$executeRaw`UPDATE manuals SET embedding = NULL`;

        console.log('✅ 모든 기존 임베딩 삭제 완료!');
        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ 오류:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

clearAllEmbeddings();
