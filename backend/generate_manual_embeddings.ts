import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { generateEmbedding } from './src/lib/openai.js';

const prisma = new PrismaClient();

async function generateManualEmbeddings() {
    try {
        const manualsWithoutEmbedding: any[] = await prisma.$queryRaw`
            SELECT id, title, content
            FROM manuals 
            WHERE is_deleted = false AND embedding IS NULL
        `;

        console.log(`Found ${manualsWithoutEmbedding.length} Manual entries without embeddings\n`);

        for (const manual of manualsWithoutEmbedding) {
            console.log(`Processing: ${manual.title}`);

            // Generate embedding
            const textToEmbed = `${manual.title} ${manual.content}`;
            const embedding = await generateEmbedding(textToEmbed);

            // Update database
            await prisma.$executeRaw`
                UPDATE manuals
                SET embedding = ${`[${embedding.join(',')}]`}::vector
                WHERE id = ${manual.id}
            `;

            console.log(`✓ Generated embedding for: ${manual.title}\n`);
        }

        console.log('✅ All Manual embeddings generated successfully!');
        await prisma.$disconnect();

    } catch (error) {
        console.error('❌ Error:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

generateManualEmbeddings();
