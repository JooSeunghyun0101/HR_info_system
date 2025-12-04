import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { generateEmbedding } from './src/lib/openai.js';

const prisma = new PrismaClient();

async function generateMissingEmbeddings() {
    try {
        const qnasWithoutEmbedding: any[] = await prisma.$queryRaw`
            SELECT id, question_title, question_details, answer
            FROM qna_entries 
            WHERE is_deleted = false AND embedding IS NULL
        `;

        console.log(`Found ${qnasWithoutEmbedding.length} Q&A entries without embeddings\n`);

        for (const qna of qnasWithoutEmbedding) {
            console.log(`Processing: ${qna.question_title}`);

            // Generate embedding
            const textToEmbed = `${qna.question_title} ${qna.question_details} ${qna.answer || ''}`;
            const embedding = await generateEmbedding(textToEmbed);

            // Update database
            await prisma.$executeRaw`
                UPDATE qna_entries
                SET embedding = ${`[${embedding.join(',')}]`}::vector
                WHERE id = ${qna.id}
            `;

            console.log(`✓ Generated embedding for: ${qna.question_title}\n`);
        }

        console.log('✅ All embeddings generated successfully!');
        await prisma.$disconnect();

    } catch (error) {
        console.error('❌ Error:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

generateMissingEmbeddings();
