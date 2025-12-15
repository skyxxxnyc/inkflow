
export enum AppMode {
    WRITE = 'WRITE',
    DRAFT = 'DRAFT',
    READ = 'READ' // New mode for Pocket clone
}

export enum DocumentStatus {
    DRAFT = 'Draft',
    IN_REVIEW = 'In Review',
    PUBLISHED = 'Published'
}

export enum CMSPlatform {
    WORDPRESS = 'WordPress',
    GHOST = 'Ghost',
    WEBFLOW = 'Webflow',
    MEDIUM = 'Medium',
    DEVTO = 'Dev.to'
}

export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
}

export interface CMSConnection {
    id: string;
    name: string;
    platform: CMSPlatform;
    url?: string;
    apiKey?: string;
}

export interface Database {
    id: string;
    name: string;
    description?: string;
    createdAt: number;
}

export interface Document {
    id: string;
    title: string;
    content: string;
    status: DocumentStatus;
    cmsConnectionId?: string;
    databaseId?: string;
    tags: string[];
    createdAt: number;
    updatedAt: number;
}

// Updated from simple 'Article' to robust Reading Item
export interface ReadingItem {
    id: string;
    url: string;
    title: string;
    domain: string;
    excerpt?: string;
    image?: string; // OG Image
    tags: string[];
    status: 'unread' | 'archived' | 'favorite';
    addedAt: number;
    aiSummary?: string;
    sourceType: 'manual' | 'rss' | 'discovery';
}

export interface Suggestion {
    id: string;
    originalText: string;
    text: string;
    rationale: string;
    type: 'tone' | 'grammar' | 'clarity' | 'creative';
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: number;
}

export interface FileAttachment {
    name: string;
    type: string;
    data: string; // base64
}

// Deprecated in favor of ReadingItem, but kept for legacy props compatibility if needed
export interface Article {
    title: string;
    uri: string;
    domain: string;
}

export interface PromptSettings {
    fixGrammar: string;
    shorten: string;
    professional: string;
    expand: string;
    formal: string;
    casual: string;
    concise: string;
    summarize: string;
}

export const DEFAULT_PROMPT_SETTINGS: PromptSettings = {
    fixGrammar: "Fix grammar and spelling",
    shorten: "Make it shorter and punchier",
    professional: "Make it more professional",
    expand: "Expand on this idea",
    formal: "Rewrite this in a formal tone",
    casual: "Rewrite this in a casual, conversational tone",
    concise: "Make this concise and to the point",
    summarize: "Summarize this text concisely"
};
