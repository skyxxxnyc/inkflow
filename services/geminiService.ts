import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { FileAttachment } from '../types';

const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSmartSuggestions = async (text: string): Promise<{ suggestion: string; originalText: string; rationale: string; type: string } | null> => {
    if (!text || text.length < 50) return null;

    const ai = getAi();
    
    // We use Flash for quick, background analysis
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are a proactive editor. Analyze the following text snippet (which is the end of a user's document). 
            
            Focus on the last few sentences.
            If you see a clear improvement (grammar, punchiness, clarity) or a creative enhancement, suggest a replacement for a SPECIFIC phrase or sentence.
            Do not suggest changes for the sake of it. Only if it adds significant value.
            
            Text to analyze: "${text.slice(-800)}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        originalText: { type: Type.STRING, description: "The EXACT substring from the input text that should be replaced." },
                        suggestion: { type: Type.STRING, description: "The suggested replacement text." },
                        rationale: { type: Type.STRING, description: "Why this change helps (very brief)." },
                        type: { type: Type.STRING, enum: ["tone", "grammar", "clarity", "creative"], description: "Type of suggestion" },
                        shouldSuggest: { type: Type.BOOLEAN, description: "Set to true only if a suggestion is made." }
                    },
                    required: ["shouldSuggest"]
                }
            }
        });

        const result = JSON.parse(response.text || '{}');
        if (result.shouldSuggest && result.suggestion && result.originalText) {
            return {
                originalText: result.originalText,
                suggestion: result.suggestion,
                rationale: result.rationale,
                type: result.type
            };
        }
        return null;
    } catch (e) {
        console.error("Gemini Suggestion Error", e);
        return null;
    }
};

export const rewriteSelection = async (selection: string, instruction: string, context: string): Promise<string> => {
    const ai = getAi();
    
    // Use Pro for high quality rewriting
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `You are an expert editor.
            
            Original Context (for reference): "...${context.slice(-300)}..."
            
            Target Selection to Rewrite: "${selection}"
            
            User Instruction: "${instruction}"
            
            Return ONLY the rewritten text. Do not add quotes or explanations.`,
        });
        return response.text || selection;
    } catch (e) {
        console.error("Gemini Rewrite Error", e);
        return selection;
    }
};

export const draftFromScratch = async (prompt: string, context: string, files: FileAttachment[]): Promise<string> => {
    const ai = getAi();
    
    const parts: any[] = [];
    
    // Add text prompt
    let fullPrompt = `You are a thought partner. Write a draft based on this request: ${prompt}`;
    
    if (context) {
        fullPrompt += `\n\nAdditional Context/Background Information:\n${context}`;
    }
    
    parts.push({ text: fullPrompt });
    
    // Add files
    files.forEach(f => {
        // strip data:image/png;base64, prefix if present
        const base64Data = f.data.split(',')[1] || f.data;
        parts.push({
            inlineData: {
                mimeType: f.type,
                data: base64Data
            }
        });
    });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // Using Pro for high quality drafting
            contents: { parts },
            config: {
                systemInstruction: "You are a professional writer using markdown formatting. Use headers, bullet points, and bold text where appropriate.",
            }
        });
        return response.text || "";
    } catch (e) {
        console.error("Gemini Draft Error", e);
        return "Error generating draft. Please check your API key or connection.";
    }
};

export const getCompletion = async (text: string): Promise<string> => {
    if (!text || text.length < 10) return "";
    const ai = getAi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are a helpful writing assistant. Provide a short completion (3-10 words) for the current sentence or thought.
            
            Input text: "${text.slice(-500)}"
            
            Return ONLY the completion text. No quotes.`,
        });
        return response.text?.trimEnd() || "";
    } catch (e) {
        // Silently fail for completions
        return "";
    }
};

// Agentic Research Check
export const checkFacts = async (text: string): Promise<any> => {
    const ai = getAi();
    // Use Google Search tool via gemini-2.5-flash (supported for text tasks)
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Fact check this text. If specific claims are dubious, point them out. If generally accurate, say "Looks accurate".
            
            Text: "${text}"`,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });
        
        const grounding = response.candidates?.[0]?.groundingMetadata;
        return {
            text: response.text,
            grounding
        };
    } catch (e) {
        return { text: "Could not verify facts at this time." };
    }
};

// --- MODULE: SEO CMS ---
export const generateSeoArticle = async (topic: string, keywords: string, audience: string, tone: string): Promise<string> => {
    const ai = getAi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `You are an expert SEO Content Writer.
            
            Task: Write a high-ranking blog post.
            Topic: ${topic}
            Target Keywords: ${keywords}
            Target Audience: ${audience}
            Tone: ${tone}
            
            Requirements:
            1. Create a catchy, SEO-optimized Title (H1).
            2. Use proper Markdown structure (H2, H3, bullet points).
            3. Include a Meta Description at the very top (in a blockquote).
            4. Ensure natural keyword placement.
            5. Content should be engaging and comprehensive.`,
        });
        return response.text || "";
    } catch (e) {
        console.error("SEO Draft Error", e);
        return "Error generating SEO content.";
    }
};

// --- MODULE: RESUME OPTIMIZER ---
export const optimizeResume = async (jobInput: string, currentResumeFiles: FileAttachment[]): Promise<string> => {
    const ai = getAi();
    const parts: any[] = [];
    
    // Add prompt
    parts.push({ text: `You are an expert Resume Writer and Career Coach.
    
    Task: Rewrite and optimize the user's resume for a specific job.
    
    Job Description / URL: "${jobInput}"
    
    Instructions:
    1. Analyze the Job Description (if it is a URL, use your Google Search tool to find the job details).
    2. Extract key skills and requirements.
    3. Rewrite the provided resume to highlight these skills.
    4. Improve bullet points to be impact-driven (Action Verb + Task + Result).
    5. Add a tailored Summary section.
    6. Output the full optimized resume in Markdown.
    
    After the resume, include a brief Cover Letter draft.` });
    
    // Add resume files
    currentResumeFiles.forEach(f => {
        const base64Data = f.data.split(',')[1] || f.data;
        parts.push({
            inlineData: {
                mimeType: f.type,
                data: base64Data
            }
        });
    });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts },
            config: {
                // We enable search in case the user provided a URL
                tools: [{ googleSearch: {} }],
            }
        });
        return response.text || "";
    } catch (e) {
        console.error("Resume Optimize Error", e);
        return "Error optimizing resume. Please ensure the Job URL is accessible or paste the description directly.";
    }
};

// --- MODULE: READING LIST INSIGHTS ---

export const getArticleInsights = async (url: string, title: string): Promise<string> => {
    const ai = getAi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `I have saved this article to my reading list. Please provide a concise summary (3 bullet points) and one "Key Takeaway" for a writer.
            
            Article Title: "${title}"
            Article URL: "${url}"
            
            If you can't access the specific URL content, infer the likely content from the title and domain, but mention that it is an estimation.`,
            config: {
                tools: [{ googleSearch: {} }], // Use search to find the article content
            }
        });
        return response.text || "Could not generate insights.";
    } catch (e) {
        console.error("Insight Error", e);
        return "Error generating insights.";
    }
};

export const findRelatedArticles = async (topic: string): Promise<any[]> => {
    const ai = getAi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Find 5 high-quality, recent articles or blog posts about: "${topic}".
            Return them in a structured list with Title and URL.`,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });
        
        // Extract from grounding chunks for accuracy
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        // Map chunks to a cleaner format. 
        // Note: Grounding chunks structure varies, but usually has web object.
        const articles = chunks
            .filter((c: any) => c.web?.uri && c.web?.title)
            .map((c: any) => ({
                title: c.web.title,
                url: c.web.uri,
                domain: new URL(c.web.uri).hostname.replace('www.', '')
            }));
            
        // Deduplicate
        const unique = articles.filter((v: any,i: number,a: any)=>a.findIndex((v2: any)=>(v2.url===v.url))===i);
        return unique.slice(0, 5);
    } catch (e) {
        console.error("Discovery Error", e);
        return [];
    }
};

export const generateSocialShare = async (title: string, summary: string): Promise<string> => {
     const ai = getAi();
     try {
         const response = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: `Write a catchy LinkedIn/Twitter post sharing this article. Use emojis and hashtags.
             
             Article: ${title}
             Summary: ${summary}`
         });
         return response.text || "";
     } catch (e) {
         return "";
     }
}
