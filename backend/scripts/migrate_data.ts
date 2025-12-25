import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const sourcePrisma = new PrismaClient({
    datasourceUrl: "postgresql://postgres:postgres@127.0.0.1:5433/qna_db"
});

const targetPrisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
});

async function migrate() {
    console.log('🚀 Starting migration (Debug Mode)...');

    // 1. Users
    const users = await sourcePrisma.user.findMany();
    console.log(`Processing ${users.length} users...`);
    for (const u of users) {
        try {
            await targetPrisma.user.upsert({
                where: { email: u.email },
                update: {},
                create: u
            });
        } catch (e: any) {
            console.error(`Failed User ${u.email}:`, e.code, e.message);
        }
    }

    // 2. Categories
    const categories = await sourcePrisma.category.findMany();
    console.log(`Processing ${categories.length} categories...`);
    for (const c of categories) {
        try {
            await targetPrisma.category.upsert({
                where: { id: c.id },
                update: {},
                create: c
            });
        } catch (e: any) {
            console.error(`Failed Category ${c.name}:`, e.code);
        }
    }

    // 3. Tags
    const tags = await sourcePrisma.tag.findMany();
    console.log(`Processing ${tags.length} tags...`);
    for (const t of tags) {
        try {
            await targetPrisma.tag.upsert({
                where: { id: t.id },
                update: {},
                create: t
            });
        } catch (e: any) {
            console.error(`Failed Tag ${t.name}:`, e.code);
        }
    }

    // 4. Manuals
    const manuals = await sourcePrisma.manual.findMany();
    console.log(`Processing ${manuals.length} manuals...`);
    for (const m of manuals) {
        const { embedding, ...data } = m as any;
        try {
            await targetPrisma.manual.upsert({
                where: { id: m.id },
                update: {},
                create: data
            });
            // Update embedding
            if (embedding) {
                await targetPrisma.$executeRawUnsafe(
                    `UPDATE manuals SET embedding = $1::vector WHERE id = $2`,
                    embedding, m.id
                );
            }
        } catch (e: any) {
            console.error(`Failed Manual ${m.title}:`, e.message);
        }
    }

    // 5. Manual Versions
    const manualVersions = await sourcePrisma.manualVersion.findMany();
    console.log(`Processing ${manualVersions.length} manual versions...`);
    for (const v of manualVersions) {
        try {
            await targetPrisma.manualVersion.upsert({
                where: { id: v.id },
                update: {},
                create: v
            });
        } catch (e: any) {
            console.error(`Failed Version ${v.id}:`, e.message);
        }
    }

    // 6. QnA Entries
    const qnas = await sourcePrisma.qnAEntry.findMany();
    console.log(`Processing ${qnas.length} QnA entries...`);
    for (const q of qnas) {
        const { embedding, ...data } = q as any;
        try {
            await targetPrisma.qnAEntry.upsert({
                where: { id: q.id },
                update: {},
                create: data
            });
            if (embedding) {
                await targetPrisma.$executeRawUnsafe(
                    `UPDATE qna_entries SET embedding = $1::vector WHERE id = $2`,
                    embedding, q.id
                );
            }
        } catch (e: any) {
            console.error(`Failed QnA ${q.question_title}:`, e.message);
        }
    }

    // 7. QnA Categories
    // For many-to-many, we just delete and recreate or try createMany with skipDuplicates
    const qnaCats = await sourcePrisma.qnACategory.findMany();
    console.log(`Linking ${qnaCats.length} QCategories...`);
    await targetPrisma.qnACategory.createMany({ data: qnaCats, skipDuplicates: true });

    // 8. QnA Tags
    const qnaTags = await sourcePrisma.qnATag.findMany();
    console.log(`Linking ${qnaTags.length} QTags...`);
    await targetPrisma.qnATag.createMany({ data: qnaTags, skipDuplicates: true });

    console.log('✅ Migration complete!');
}

migrate()
    .catch(console.error)
    .finally(async () => {
        await sourcePrisma.$disconnect();
        await targetPrisma.$disconnect();
    });
