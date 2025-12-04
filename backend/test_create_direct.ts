import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { generateEmbedding } from './src/lib/openai.js';

const prisma = new PrismaClient();

async function testCreate() {
    try {
        console.log('Testing Q&A creation with embedding...');

        // Get a category
        const category = await prisma.category.findFirst();
        if (!category) {
            console.error('No category found');
            return;
        }
        console.log('Using category:', category.name);

        // Get admin user
        const admin = await prisma.user.findUnique({
            where: { email: 'admin@example.com' }
        });
        if (!admin) {
            console.error('Admin not found');
            return;
        }
        console.log('Using admin:', admin.email);

        // Generate embedding
        const textToEmbed = 'Test Question Direct Script Testing Q&A creation ';
        console.log('Generating embedding...');
        const embedding = await generateEmbedding(textToEmbed);
        console.log('Embedding generated. Length:', embedding.length);

        // Create Q&A
        console.log('Creating Q&A...');
        const qna = await prisma.qnAEntry.create({
            data: {
                question_title: 'Test Question Direct Script',
                question_details: 'Testing Q&A creation',
                answer: 'Test answer',
                created_by_id: admin.id,
                categories: {
                    create: [{
                        category: { connect: { id: category.id } }
                    }]
                },
                tags: {
                    create: [{
                        tag: {
                            connectOrCreate: {
                                where: { name: 'direct-test' },
                                create: { name: 'direct-test' }
                            }
                        }
                    }]
                }
            },
            include: {
                categories: { include: { category: true } },
                tags: { include: { tag: true } }
            }
        });

        console.log('Q&A created with ID:', qna.id);

        // Update embedding
        console.log('Updating embedding...');
        await prisma.$executeRaw`
            UPDATE qna_entries
            SET embedding = ${embedding}::vector
            WHERE id = ${qna.id}
        `;
        console.log('✅ Embedding updated successfully');

        // Verify
        const result = await prisma.qnAEntry.findUnique({
            where: { id: qna.id },
            include: {
                categories: { include: { category: true } },
                tags: { include: { tag: true } }
            }
        });
        console.log('✅ Q&A created successfully:');
        console.log('   Title:', result?.question_title);
        console.log('   Categories:', result?.categories.length);
        console.log('   Tags:', result?.tags.length);

        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Error:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

testCreate();
