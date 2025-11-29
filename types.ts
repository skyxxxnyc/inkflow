
export enum AppMode {
    WRITE = 'WRITE',
    DRAFT = 'DRAFT', // The agentic drafting mode
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

export interface CMSConnection {
    id: string;
    name: string;
    platform: CMSPlatform;
    url?: string;
    apiKey?: string; // Stored locally only
}

export interface Document {
    id: string;
    title: string;
    content: string;
    status: DocumentStatus;
    cmsConnectionId?: string; // Linked CMS
    tags: string[];
    createdAt: number;
    updatedAt: number;
}

export interface Suggestion {
    id: string;
    originalText: string;
    text: string;
    rationale: string;
    type: 'tone' | 'grammar' | 'clarity' | 'creative';
}

export interface GenerationConfig {
    model: string;
    temperature: number;
}

export interface FileAttachment {
    name: string;
    type: string;
    data: string; // base64
}

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
