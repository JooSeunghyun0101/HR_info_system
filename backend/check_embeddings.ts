import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEmbeddings() {
    try {
        const results: any[] = await prisma.$queryRaw`
            SELECT id, question_title, 
                   embedding IS NOT NULL as has_embedding
            FROM qna_entries 
            WHERE is_deleted = false
            LIMIT 10
        `;

        console.log('\n=== Q&A Entries and Embeddings ===');
        results.forEach((r: any) => {
            console.log(`Title: ${r.question_title}`);
            console.log(`Has Embedding: ${r.has_embedding}\n`);
        });

        const total = await prisma.qnAEntry.count({ where: { is_deleted: false } });
        console.log(`Total Q&A entries: ${total}`);

        const withEmbedding: any = await prisma.$queryRaw`
            SELECT COUNT(*) as count 
            FROM qna_entries 
            WHERE is_deleted = false AND embedding IS NOT NULL
        `;
        console.log(`Entries with embeddings: ${withEmbedding[0].count}`);

        await prisma.$disconnect();

    } catch (error) {
        console.error('Error:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

checkEmbeddings();
