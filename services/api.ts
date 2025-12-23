import { User, Document, Database, ReadingItem, CMSConnection } from '../types';

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';

const getHeaders = (userId?: string) => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (userId) {
        headers['x-user-id'] = userId;
    }
    return headers;
};

export const api = {
    // Auth / User
    login: async (email: string, name: string, avatar?: string): Promise<User> => {
        const res = await fetch(`${API_BASE}/users`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ email, name, avatar })
        });
        return res.json();
    },

    // Documents
    getDocuments: async (userId: string): Promise<Document[]> => {
        const res = await fetch(`${API_BASE}/documents`, {
            headers: getHeaders(userId)
        });
        const docs = await res.json();
        return docs.map((d: any) => ({
            ...d,
            tags: typeof d.tags === 'string' ? JSON.parse(d.tags) : d.tags,
            properties: typeof d.properties === 'string' ? JSON.parse(d.properties) : (d.properties || {}),
            createdAt: new Date(d.createdAt).getTime(),
            updatedAt: new Date(d.updatedAt).getTime(),
        }));
    },

    createDocument: async (userId: string, doc: Partial<Document>): Promise<Document> => {
        const res = await fetch(`${API_BASE}/documents`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify(doc)
        });
        return res.json();
    },

    updateDocument: async (userId: string, id: string, doc: Partial<Document>): Promise<Document> => {
        const res = await fetch(`${API_BASE}/documents/${id}`, {
            method: 'PUT',
            headers: getHeaders(userId),
            body: JSON.stringify(doc)
        });
        return res.json();
    },

    deleteDocument: async (userId: string, id: string): Promise<void> => {
        await fetch(`${API_BASE}/documents/${id}`, {
            method: 'DELETE',
            headers: getHeaders(userId)
        });
    },

    // Databases
    getDatabases: async (userId: string): Promise<Database[]> => {
        const res = await fetch(`${API_BASE}/databases`, {
            headers: getHeaders(userId)
        });
        return res.json();
    },

    createDatabase: async (userId: string, name: string, description?: string, viewType: string = 'TABLE'): Promise<Database> => {
        const res = await fetch(`${API_BASE}/databases`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify({ name, description, viewType })
        });
        return res.json();
    },

    updateDatabase: async (userId: string, id: string, data: Partial<Database>): Promise<Database> => {
        const res = await fetch(`${API_BASE}/databases/${id}`, {
            method: 'PUT',
            headers: getHeaders(userId),
            body: JSON.stringify(data)
        });
        return res.json();
    },

    deleteDatabase: async (userId: string, id: string): Promise<void> => {
        await fetch(`${API_BASE}/databases/${id}`, {
            method: 'DELETE',
            headers: getHeaders(userId)
        });
    },

    // CMS Connections
    getCMSConnections: async (userId: string): Promise<CMSConnection[]> => {
        const res = await fetch(`${API_BASE}/cms-connections`, {
            headers: getHeaders(userId)
        });
        return res.json();
    },

    createCMSConnection: async (userId: string, conn: Partial<CMSConnection>): Promise<CMSConnection> => {
        const res = await fetch(`${API_BASE}/cms-connections`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify(conn)
        });
        return res.json();
    },

    deleteCMSConnection: async (userId: string, id: string): Promise<void> => {
        await fetch(`${API_BASE}/cms-connections/${id}`, {
            method: 'DELETE',
            headers: getHeaders(userId)
        });
    },

    // Settings
    getSettings: async (userId: string): Promise<any> => {
        const res = await fetch(`${API_BASE}/settings`, {
            headers: getHeaders(userId)
        });
        return res.json();
    },

    updateSettings: async (userId: string, settings: any): Promise<void> => {
        await fetch(`${API_BASE}/settings`, {
            method: 'PUT',
            headers: getHeaders(userId),
            body: JSON.stringify(settings)
        });
    },

    // Reading List
    getReadingItems: async (userId: string): Promise<ReadingItem[]> => {
        const res = await fetch(`${API_BASE}/reading-list`, {
            headers: getHeaders(userId)
        });
        const items = await res.json();
        return items.map((i: any) => ({
            ...i,
            tags: typeof i.tags === 'string' ? JSON.parse(i.tags) : i.tags,
            addedAt: new Date(i.addedAt).getTime()
        }));
    },

    addReadingItem: async (userId: string, item: Partial<ReadingItem>): Promise<ReadingItem> => {
        const res = await fetch(`${API_BASE}/reading-list`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify(item)
        });
        return res.json();
    },

    updateReadingItem: async (userId: string, id: string, item: Partial<ReadingItem>): Promise<ReadingItem> => {
        const res = await fetch(`${API_BASE}/reading-list/${id}`, {
            method: 'PUT',
            headers: getHeaders(userId),
            body: JSON.stringify(item)
        });
        return res.json();
    },

    deleteReadingItem: async (userId: string, id: string): Promise<void> => {
        await fetch(`${API_BASE}/reading-list/${id}`, {
            method: 'DELETE',
            headers: getHeaders(userId)
        });
    },

    // AI Prompts
    getPrompts: async (userId: string): Promise<any[]> => {
        const res = await fetch(`${API_BASE}/prompts`, {
            headers: getHeaders(userId)
        });
        const prompts = await res.json();
        return prompts.map((p: any) => ({
            ...p,
            tags: typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags,
            createdAt: new Date(p.createdAt).getTime(),
            updatedAt: new Date(p.updatedAt).getTime(),
        }));
    },

    createPrompt: async (userId: string, prompt: any): Promise<any> => {
        const res = await fetch(`${API_BASE}/prompts`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify(prompt)
        });
        return res.json();
    },

    updatePrompt: async (userId: string, id: string, prompt: any): Promise<any> => {
        const res = await fetch(`${API_BASE}/prompts/${id}`, {
            method: 'PUT',
            headers: getHeaders(userId),
            body: JSON.stringify(prompt)
        });
        return res.json();
    },

    deletePrompt: async (userId: string, id: string): Promise<void> => {
        await fetch(`${API_BASE}/prompts/${id}`, {
            method: 'DELETE',
            headers: getHeaders(userId)
        });
    },

    deletePromptsBatch: async (userId: string, ids: string[]): Promise<void> => {
        await fetch(`${API_BASE}/prompts/delete-batch`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify({ ids })
        });
    },

    importPrompts: async (userId: string, prompts: any[]): Promise<void> => {
        await fetch(`${API_BASE}/prompts/batch`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify({ prompts })
        });
    }
};
