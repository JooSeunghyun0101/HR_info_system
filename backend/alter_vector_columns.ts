import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function alterVectorColumns() {
    try {
        console.log('데이터베이스 벡터 컬럼 변경 중...\n');

        // Drop old columns
        console.log('1. 기존 embedding 컬럼 삭제...');
        await prisma.$executeRawUnsafe(`ALTER TABLE qna_entries DROP COLUMN IF EXISTS embedding`);
        await prisma.$executeRawUnsafe(`ALTER TABLE manuals DROP COLUMN IF EXISTS embedding`);
        console.log('✓ 완료\n');

        // Add new columns with vector(3072)
        console.log('2. 새로운 embedding 컬럼 추가 (vector(3072))...');
        await prisma.$executeRawUnsafe(`ALTER TABLE qna_entries ADD COLUMN embedding vector(3072)`);
        await prisma.$executeRawUnsafe(`ALTER TABLE manuals ADD COLUMN embedding vector(3072)`);
        console.log('✓ 완료\n');

        console.log('✅ 데이터베이스 벡터 컬럼 변경 완료!');
        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ 오류:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

alterVectorColumns();
