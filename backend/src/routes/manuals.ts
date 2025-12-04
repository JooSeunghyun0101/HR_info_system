import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateEmbedding } from '../lib/openai.js';

const router = Router();
const prisma = new PrismaClient();

// Create Manual
router.post('/', authenticateToken, requireRole(['hr_staff', 'admin']), async (req, res) => {
    const { title, content, qna_ids } = req.body;
    const userId = req.user!.id;

    try {
        // Generate embedding
        const textToEmbed = `${title} ${content}`;
        const embedding = await generateEmbedding(textToEmbed);

        const manual = await prisma.manual.create({
            data: {
                title,
                content,
                created_by_id: userId,
                version_major: 1,
                version_minor: 0,
                versions: {
                    create: {
                        version_major: 1,
                        version_minor: 0,
                        content,
                        change_type: 'major', // Initial creation
                        change_log: 'Initial creation',
                        created_by_id: userId
                    }
                },
                qna_sources: qna_ids ? {
                    create: qna_ids.map((qnaId: string) => ({
                        qna: { connect: { id: qnaId } }
                    }))
                } : undefined
            },
            include: {
                versions: true,
                qna_sources: { include: { qna: true } }
            }
        });

        // Update embedding separately
        await prisma.$executeRaw`
            UPDATE manuals
            SET embedding = ${`[${embedding.join(',')}]`}::vector
            WHERE id = ${manual.id}
        `;

        res.status(201).json(manual);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get all Manuals
router.get('/', authenticateToken, async (req, res) => {
    const { q, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    try {
        let manuals: any[] = [];
        let total: number = 0;

        if (q) {
            // Hybrid search: Vector + Keyword
            const embedding = await generateEmbedding(String(q));
            const embeddingStr = `[${embedding.join(',')}]`;

            // 1. Vector search
            const vectorQuery = `
                SELECT id, 1 - (embedding <=> $1::vector) as similarity
                FROM manuals
                WHERE is_deleted = false
                  AND embedding IS NOT NULL
                  AND 1 - (embedding <=> $1::vector) > 0.3
                ORDER BY similarity DESC
                LIMIT 50
            `;

            const vectorResults: any[] = await prisma.$queryRawUnsafe(vectorQuery, embeddingStr);

            // 2. Keyword search (for exact matches, typos, language variations)
            const keywordResults = await prisma.manual.findMany({
                where: {
                    is_deleted: false,
                    OR: [
                        { title: { contains: String(q), mode: 'insensitive' } },
                        { content: { contains: String(q), mode: 'insensitive' } }
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

            // Fetch full Manual data
            const resultIds = scoredIds.slice(skip, skip + Number(limit)).map(s => s.id);
            const fetchedManuals = await prisma.manual.findMany({
                where: { id: { in: resultIds } },
                include: {
                    created_by: { select: { full_name: true } },
                    updated_by: { select: { full_name: true } }
                }
            });

            // Re-order based on score
            manuals = resultIds.map(id => fetchedManuals.find(m => m.id === id)).filter(Boolean);
            total = scoredIds.length;
        } else {
            // Standard filter
            const where: any = { is_deleted: false };

            const [count, data] = await prisma.$transaction([
                prisma.manual.count({ where }),
                prisma.manual.findMany({
                    where,
                    skip,
                    take: Number(limit),
                    orderBy: { updated_at: 'desc' },
                    include: {
                        created_by: { select: { full_name: true } },
                        updated_by: { select: { full_name: true } }
                    }
                })
            ]);
            total = count;
            manuals = data;
        }

        res.json({
            data: manuals,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get Manual by ID
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const manual = await prisma.manual.findUnique({
            where: { id },
            include: {
                versions: { orderBy: { created_at: 'desc' } },
                qna_sources: { include: { qna: true } },
                created_by: { select: { full_name: true } },
                updated_by: { select: { full_name: true } }
            }
        });

        if (!manual || manual.is_deleted) {
            return res.status(404).json({ message: 'Manual not found' });
        }

        res.json(manual);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update Manual (New Version)
router.put('/:id', authenticateToken, requireRole(['hr_staff', 'admin']), async (req, res) => {
    const { id } = req.params;
    const { title, content, change_type, change_log } = req.body; // change_type: 'major' | 'minor'
    const userId = req.user!.id;

    try {
        const currentManual = await prisma.manual.findUnique({ where: { id } });
        if (!currentManual) return res.status(404).json({ message: 'Manual not found' });

        let newMajor = currentManual.version_major;
        let newMinor = currentManual.version_minor;

        if (change_type === 'major') {
            newMajor += 1;
            newMinor = 0;
        } else {
            newMinor += 1;
        }

        const manual = await prisma.manual.update({
            where: { id },
            data: {
                title,
                content,
                version_major: newMajor,
                version_minor: newMinor,
                updated_by_id: userId,
                versions: {
                    create: {
                        version_major: newMajor,
                        version_minor: newMinor,
                        content,
                        change_type: change_type || 'minor',
                        change_log: change_log || 'Updated manual',
                        created_by_id: userId
                    }
                }
            },
            include: {
                versions: true
            }
        });

        res.json(manual);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete Manual
router.delete('/:id', authenticateToken, requireRole(['hr_staff', 'admin']), async (req, res) => {
    const { id } = req.params;
    const userId = req.user!.id;

    try {
        await prisma.manual.update({
            where: { id },
            data: {
                is_deleted: true,
                deleted_at: new Date(),
                deleted_by_id: userId
            }
        });

        res.json({ message: 'Manual deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
