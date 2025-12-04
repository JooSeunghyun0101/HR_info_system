import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { generateEmbedding } from './src/lib/openai.js';

const prisma = new PrismaClient();

async function regenerateAllEmbeddings() {
    try {
        // 1. Q&A 임베딩 재생성
        const qnas: any[] = await prisma.$queryRaw`
            SELECT id, question_title, question_details, answer
            FROM qna_entries 
            WHERE is_deleted = false
        `;

        console.log(`\n=== Q&A 임베딩 재생성 ===`);
        console.log(`총 ${qnas.length}개의 Q&A 처리 중...\n`);

        for (let i = 0; i < qnas.length; i++) {
            const qna = qnas[i];
            console.log(`[${i + 1}/${qnas.length}] ${qna.question_title}`);

            const textToEmbed = `${qna.question_title} ${qna.question_details} ${qna.answer || ''}`;
            const embedding = await generateEmbedding(textToEmbed);

            await prisma.$executeRaw`
                UPDATE qna_entries
                SET embedding = ${`[${embedding.join(',')}]`}::vector
                WHERE id = ${qna.id}
            `;

            console.log(`✓ 완료\n`);
        }

        // 2. Manual 임베딩 재생성
        const manuals: any[] = await prisma.$queryRaw`
            SELECT id, title, content
            FROM manuals 
            WHERE is_deleted = false
        `;

        console.log(`\n=== Manual 임베딩 재생성 ===`);
        console.log(`총 ${manuals.length}개의 Manual 처리 중...\n`);

        for (let i = 0; i < manuals.length; i++) {
            const manual = manuals[i];
            console.log(`[${i + 1}/${manuals.length}] ${manual.title}`);

            const textToEmbed = `${manual.title} ${manual.content}`;
            const embedding = await generateEmbedding(textToEmbed);

            await prisma.$executeRaw`
                UPDATE manuals
                SET embedding = ${`[${embedding.join(',')}]`}::vector
                WHERE id = ${manual.id}
            `;

            console.log(`✓ 완료\n`);
        }

        console.log('\n🎉 모든 임베딩 재생성 완료!');
        console.log(`✅ Q&A: ${qnas.length}개`);
        console.log(`✅ Manual: ${manuals.length}개`);

        await prisma.$disconnect();

    } catch (error) {
        console.error('❌ 오류 발생:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

regenerateAllEmbeddings();
