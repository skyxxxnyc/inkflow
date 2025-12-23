import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

// --- Basic Auth / User Middleware ---
// In a real app, this would use JWT. For this draft, we'll accept a userId header for simplicity.
app.use((req, res, next) => {
    const userId = req.headers['x-user-id'];
    if (userId) {
        (req as any).userId = userId;
    }
    next();
});

// --- ROUTES ---

// USERS
app.post('/api/users', async (req, res) => {
    const { email, name, avatar } = req.body;
    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: { name, avatar },
            create: { email, name, avatar },
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// DOCUMENTS
app.get('/api/documents', async (req, res) => {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const docs = await prisma.document.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' }
    });
    res.json(docs.map(d => ({
        ...d,
        tags: JSON.parse(d.tags || '[]'),
        properties: JSON.parse(d.properties || '{}')
    })));
});
app.post('/api/documents', async (req, res) => {
    const userId = (req as any).userId;
    const { title, content, status, databaseId, parentId, tags, icon, cover, properties } = req.body;

    try {
        const doc = await prisma.document.create({
            data: {
                title,
                content,
                status,
                databaseId,
                parentId,
                icon,
                cover,
                properties: JSON.stringify(properties || {}),
                tags: JSON.stringify(tags || []),
                userId
            }
        });
        res.json({
            ...doc,
            tags: JSON.parse(doc.tags),
            properties: JSON.parse(doc.properties)
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create document' });
    }
});

app.put('/api/documents/:id', async (req, res) => {
    const { id } = req.params;
    const { title, content, status, databaseId, parentId, tags, cmsConnectionId, icon, cover, properties } = req.body;

    try {
        const doc = await prisma.document.update({
            where: { id },
            data: {
                title,
                content,
                status,
                databaseId,
                parentId,
                cmsConnectionId,
                icon,
                cover,
                properties: properties ? JSON.stringify(properties) : undefined,
                tags: typeof tags === 'string' ? tags : JSON.stringify(tags || [])
            }
        });
        res.json({
            ...doc,
            tags: typeof doc.tags === 'string' ? JSON.parse(doc.tags) : doc.tags,
            properties: typeof doc.properties === 'string' ? JSON.parse(doc.properties) : doc.properties
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update document' });
    }
});


app.delete('/api/documents/:id', async (req, res) => {
    const { id } = req.params;
    await prisma.document.delete({ where: { id } });
    res.json({ success: true });
});

// DATABASES
app.get('/api/databases', async (req, res) => {
    const userId = (req as any).userId;
    const dbs = await prisma.database.findMany({ where: { userId } });
    res.json(dbs);
});

app.post('/api/databases', async (req, res) => {
    const userId = (req as any).userId;
    const { name, description, viewType, color } = req.body;
    const db = await prisma.database.create({
        data: { name, description, viewType, color: color || "#000000", userId }
    });
    res.json(db);
});

app.put('/api/databases/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, viewType, color } = req.body;
    const db = await prisma.database.update({
        where: { id },
        data: { name, description, viewType, color }
    });
    res.json(db);
});

app.delete('/api/databases/:id', async (req, res) => {
    const { id } = req.params;
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        // Unlink documents first
        await prisma.document.updateMany({
            where: { databaseId: id, userId },
            data: { databaseId: null }
        });

        await prisma.database.delete({
            where: { id }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete database' });
    }
});

// CMS CONNECTIONS
app.get('/api/cms-connections', async (req, res) => {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const connections = await prisma.cMSConnection.findMany({ where: { userId } });
    res.json(connections);
});

app.post('/api/cms-connections', async (req, res) => {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { name, platform, url, apiKey } = req.body;
    const conn = await prisma.cMSConnection.create({
        data: { name, platform, url, apiKey, userId }
    });
    res.json(conn);
});

app.delete('/api/cms-connections/:id', async (req, res) => {
    const { id } = req.params;
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await prisma.document.updateMany({
        where: { cmsConnectionId: id, userId },
        data: { cmsConnectionId: null }
    });

    await prisma.cMSConnection.delete({ where: { id } });
    res.json({ success: true });
});

// SETTINGS
app.get('/api/settings', async (req, res) => {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    res.json(user?.settings ? JSON.parse(user.settings) : {});
});

app.put('/api/settings', async (req, res) => {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const settings = JSON.stringify(req.body);
    await prisma.user.update({
        where: { id: userId },
        data: { settings }
    });
    res.json({ success: true });
});

// READING LIST
app.get('/api/reading-list', async (req, res) => {
    const userId = (req as any).userId;
    const items = await prisma.readingItem.findMany({
        where: { userId },
        orderBy: { addedAt: 'desc' }
    });
    res.json(items);
});

app.post('/api/reading-list', async (req, res) => {
    const userId = (req as any).userId;
    const { url, title, domain, excerpt, image, tags, sourceType } = req.body;
    const item = await prisma.readingItem.create({
        data: {
            url, title, domain, excerpt, image, sourceType,
            tags: JSON.stringify(tags || []),
            userId
        }
    });
    res.json(item);
});

app.put('/api/reading-list/:id', async (req, res) => {
    const { id } = req.params;
    const { status, tags, aiSummary } = req.body;
    const item = await prisma.readingItem.update({
        where: { id },
        data: {
            status,
            tags: typeof tags === 'string' ? tags : JSON.stringify(tags || []),
            aiSummary
        }
    });
    res.json(item);
});

app.delete('/api/reading-list/:id', async (req, res) => {
    const { id } = req.params;
    await prisma.readingItem.delete({ where: { id } });
    res.json({ success: true });
});

// PROMPTS
app.get('/api/prompts', async (req, res) => {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const prompts = await prisma.prompt.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' }
    });
    res.json(prompts);
});

app.post('/api/prompts', async (req, res) => {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { title, content, description, category, tags } = req.body;

    try {
        const prompt = await prisma.prompt.create({
            data: {
                title,
                content,
                description,
                category: category || "General",
                tags: JSON.stringify(tags || []),
                userId
            }
        });
        res.json(prompt);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create prompt' });
    }
});

app.post('/api/prompts/batch', async (req, res) => {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { prompts } = req.body;

    try {
        const data = prompts.map((p: any) => ({
            title: p.title,
            content: p.content,
            description: p.description || "",
            category: p.category || "General",
            tags: JSON.stringify(p.tags || []),
            userId
        }));

        await prisma.prompt.createMany({
            data
        });

        res.json({ success: true, count: data.length });
    } catch (error) {
        res.status(500).json({ error: 'Failed to import prompts' });
    }
});

app.put('/api/prompts/:id', async (req, res) => {
    const { id } = req.params;
    const { title, content, description, category, tags } = req.body;

    try {
        const prompt = await prisma.prompt.update({
            where: { id },
            data: {
                title,
                content,
                description,
                category,
                tags: typeof tags === 'string' ? tags : JSON.stringify(tags || [])
            }
        });
        res.json(prompt);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update prompt' });
    }
});

app.post('/api/prompts/delete-batch', async (req, res) => {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { ids } = req.body;
    try {
        await prisma.prompt.deleteMany({
            where: {
                id: { in: ids },
                userId
            }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete prompts' });
    }
});

app.delete('/api/prompts/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.prompt.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete prompt' });
    }
});

app.listen(PORT, () => {
    console.log(`InkFlow Server running on http://localhost:${PORT}`);
});
