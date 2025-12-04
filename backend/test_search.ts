import 'dotenv/config';
import { generateEmbedding } from './src/lib/openai.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSearch(query: string) {
    try {
        console.log(`\n=== Testing search for: "${query}" ===`);

        // Generate embedding for search query
        const embedding = await generateEmbedding(query);
        console.log('Embedding generated, length:', embedding.length);

        // Run vector search
        const embeddingStr = `[${embedding.join(',')}]`;

        const results: any[] = await prisma.$queryRawUnsafe(`
            SELECT id, question_title, 
                   1 - (embedding <=> $1::vector) as similarity
            FROM qna_entries
            WHERE is_deleted = false
              AND embedding IS NOT NULL
            ORDER BY similarity DESC
            LIMIT 10
        `, embeddingStr);

        console.log(`\nFound ${results.length} results:`);
        results.forEach((r: any, i: number) => {
            console.log(`${i + 1}. ${r.question_title}`);
            console.log(`   Similarity: ${r.similarity.toFixed(4)}`);
        });

        await prisma.$disconnect();

    } catch (error) {
        console.error('Error:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

// Test with the user's search queries
testSearch('평가')
    .then(() => testSearch('기여'))
    .then(() => testSearch('Test'));
