import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateEmbedding } from '../lib/openai.js';

const router = Router();
const prisma = new PrismaClient();

// Create Q&A
router.post('/', authenticateToken, requireRole(['hr_staff', 'admin']), async (req, res) => {
    const { question_title, question_details, answer, answer_basis, categories, tags } = req.body;
    const userId = req.user!.id;

    try {
        // Generate embedding
        const textToEmbed = `${question_title} ${question_details} ${answer || ''}`;
        const embedding = await generateEmbedding(textToEmbed);

        const qna = await prisma.qnAEntry.create({
            data: {
                question_title,
                question_details,
                answer,
                answer_basis,
                created_by_id: userId,
                categories: {
                    create: categories.map((catId: string) => ({
                        category: { connect: { id: catId } }
                    }))
                },
                tags: {
                    create: tags.map((tagName: string) => ({
                        tag: {
                            connectOrCreate: {
                                where: { name: tagName },
                                create: { name: tagName }
                            }
                        }
                    }))
                }
            },
            include: {
                categories: { include: { category: true } },
                tags: { include: { tag: true } }
            }
        });

        // Update embedding separately since it's an Unsupported type in Prisma schema
        await prisma.$executeRaw`
            UPDATE qna_entries
            SET embedding = ${embedding}::vector
            WHERE id = ${qna.id}
        `;

        res.status(201).json(qna);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get all Q&As (with search & filter)
router.get('/', authenticateToken, async (req, res) => {
    const { q, category, tag, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    try {
        let qnas: any[] = [];
        let total: number = 0;

        if (q) {
            // Hybrid search: Vector + Keyword
            const embedding = await generateEmbedding(String(q));
            const embeddingStr = `[${embedding.join(',')}]`;

            // 1. Vector search
            const vectorQuery = `
                SELECT id, 1 - (embedding <=> $1::vector) as similarity
                FROM qna_entries
                WHERE is_deleted = false
                  AND embedding IS NOT NULL
                  AND 1 - (embedding <=> $1::vector) > 0.3
                ORDER BY similarity DESC
                LIMIT 50
            `;

            const vectorResults: any[] = await prisma.$queryRawUnsafe(vectorQuery, embeddingStr);

            // 2. Keyword search (for exact matches, typos, language variations)
            const keywordResults = await prisma.qnAEntry.findMany({
                where: {
                    is_deleted: false,
                    OR: [
                        { question_title: { contains: String(q), mode: 'insensitive' } },
                        { question_details: { contains: String(q), mode: 'insensitive' } },
                        { answer: { contains: String(q), mode: 'insensitive' } }
                    ]
                },
                take: 50,
                select: { id: true }
            });

            // 3. Combine results (deduplicate)
            const vectorIds = new Set(vectorResults.map(r => r.id));
            const keywordIds = keywordResults.map(r => r.id);

            // Create score map
            const scoreMap = new Map();
            vectorResults.forEach(r => {
                scoreMap.set(r.id, { vector: r.similarity, keyword: 0 });
            });
            keywordResults.forEach(r => {
                if (scoreMap.has(r.id)) {
                    scoreMap.get(r.id).keyword = 1; // Boost if found in keyword search
                } else {
                    scoreMap.set(r.id, { vector: 0, keyword: 1 });
                }
            });

            // Combined unique IDs with scoring
            const allIds = Array.from(scoreMap.keys());
            const scoredIds = allIds.map(id => ({
                id,
                score: (scoreMap.get(id).vector * 0.7) + (scoreMap.get(id).keyword * 0.3)
            })).sort((a, b) => b.score - a.score);

            console.log(`Hybrid search for "${q}": vector=${vectorResults.length}, keyword=${keywordResults.length}, combined=${scoredIds.length}`);

            // Fetch full Q&A data
            const resultIds = scoredIds.slice(skip, skip + Number(limit)).map(s => s.id);
            const fetchedQnas = await prisma.qnAEntry.findMany({
                where: { id: { in: resultIds } },
                include: {
                    categories: { include: { category: true } },
                    tags: { include: { tag: true } },
                    created_by: { select: { full_name: true } }
                }
            });

            // Re-order based on score
            qnas = resultIds.map(id => fetchedQnas.find(q => q.id === id)).filter(Boolean);
            total = scoredIds.length;
        } else {
            // Standard filter
            const where: any = { is_deleted: false };

            if (category) where.categories = { some: { category_id: String(category) } };
            if (tag) where.tags = { some: { tag: { name: String(tag) } } };

            const [count, data] = await prisma.$transaction([
                prisma.qnAEntry.count({ where }),
                prisma.qnAEntry.findMany({
                    where,
                    skip,
                    take: Number(limit),
                    orderBy: { created_at: 'desc' },
                    include: {
                        categories: { include: { category: true } },
                        tags: { include: { tag: true } },
                        created_by: { select: { full_name: true } }
                    }
                })
            ]);
            total = count;
            qnas = data;
        }

        res.json({
            data: qnas,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(Number(total) / Number(limit))
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get Q&A by ID
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID is required' });

    try {
        const qna = await prisma.qnAEntry.findUnique({
            where: { id },
            include: {
                categories: { include: { category: true } },
                tags: { include: { tag: true } },
                created_by: { select: { full_name: true } }
            }
        });

        if (!qna || qna.is_deleted) {
            return res.status(404).json({ message: 'Q&A not found' });
        }

        // Increment view count
        await prisma.qnAEntry.update({
            where: { id },
            data: {
                view_count: { increment: 1 },
                last_viewed_at: new Date()
            }
        });

        res.json(qna);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update Q&A
router.put('/:id', authenticateToken, requireRole(['hr_staff', 'admin']), async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID is required' });

    const { question_title, question_details, answer, answer_basis, categories, tags } = req.body;

    try {
        // Generate embedding
        const textToEmbed = `${question_title} ${question_details} ${answer || ''}`;
        const embedding = await generateEmbedding(textToEmbed);

        const updateData: any = {
            question_title,
            question_details,
            answer,
            answer_basis,
            updated_at: new Date()
        };

        if (categories) {
            await prisma.qnACategory.deleteMany({ where: { qna_id: id } });
            updateData.categories = {
                create: categories.map((catId: string) => ({
                    category: { connect: { id: catId } }
                }))
            };
        }

        if (tags) {
            await prisma.qnATag.deleteMany({ where: { qna_id: id } });
            updateData.tags = {
                create: tags.map((tagName: string) => ({
                    tag: {
                        connectOrCreate: {
                            where: { name: tagName },
                            create: { name: tagName }
                        }
                    }
                }))
            };
        }

        const qna = await prisma.qnAEntry.update({
            where: { id },
            data: {
                ...updateData,
                updated_by_id: req.user!.id
            },
            include: {
                categories: { include: { category: true } },
                tags: { include: { tag: true } },
                created_by: { select: { id: true, full_name: true, email: true } },
                updated_by: { select: { id: true, full_name: true, email: true } }
            }
        });

        await prisma.$executeRaw`
            UPDATE qna_entries
            SET embedding = ${embedding}::vector
            WHERE id = ${id}
        `;

        res.json(qna);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete Q&A (Soft delete)
router.delete('/:id', authenticateToken, requireRole(['hr_staff', 'admin']), async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID is required' });

    const userId = req.user!.id;

    try {
        await prisma.qnAEntry.update({
            where: { id },
            data: {
                is_deleted: true,
                deleted_at: new Date(),
                deleted_by_id: userId
            }
        });

        res.json({ message: 'Q&A deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
