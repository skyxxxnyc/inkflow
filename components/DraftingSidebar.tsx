
import React, { useState, useRef, useEffect } from 'react';
import { X, Paperclip, Sparkles, Loader2, FileText, Search, Briefcase, PenTool, Bookmark, ExternalLink, Trash2, Globe, MessageSquare, Send, Copy, ArrowLeft } from 'lucide-react';
import { draftFromScratch, generateSeoArticle, optimizeResume, chatWithPartner } from '../services/geminiService';
import { FileAttachment, Article, CMSConnection, ChatMessage } from '../types';

interface DraftingSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onDraftInsert: (text: string) => void;
    savedArticles: Article[];
    onRemoveArticle: (uri: string) => void;
    cmsConnections?: CMSConnection[]; 
    onSetDocCMS?: (cmsId: string) => void;
    currentDocContent: string;
}

type ModuleMode = 'creative' | 'seo' | 'resume' | 'saved' | 'chat';

export const DraftingSidebar: React.FC<DraftingSidebarProps> = ({ 
    isOpen, 
    onClose, 
    onDraftInsert, 
    savedArticles, 
    onRemoveArticle,
    cmsConnections = [],
    onSetDocCMS,
    currentDocContent
}) => {
    const [mode, setMode] = useState<ModuleMode>('chat');
    const [isGenerating, setIsGenerating] = useState(false);
    const [files, setFiles] = useState<FileAttachment[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Chat State
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        { id: '1', role: 'model', text: 'Hi! I am your InkFlow partner. I have read your current draft. How can I help you brainstorming or editing today?', timestamp: Date.now() }
    ]);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Creative Inputs
    const [prompt, setPrompt] = useState('');
    const [context, setContext] = useState('');

    // SEO Inputs
    const [seoTopic, setSeoTopic] = useState('');
    const [seoKeywords, setSeoKeywords] = useState('');
    const [seoAudience, setSeoAudience] = useState('');
    const [seoTone, setSeoTone] = useState('Professional');
    const [selectedCMS, setSelectedCMS] = useState('');

    // Resume Inputs
    const [jobInput, setJobInput] = useState(''); // Text or URL

    useEffect(() => {
        if (mode === 'chat') {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, mode]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            Array.from(e.target.files).forEach((file: File) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFiles(prev => [...prev, {
                        name: file.name,
                        type: file.type,
                        data: reader.result as string
                    }]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim() || isGenerating) return;

        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: chatInput, timestamp: Date.now() };
        setChatMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setIsGenerating(true);

        // Call Gemini
        const response = await chatWithPartner(chatMessages, userMsg.text, currentDocContent);
        
        const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: response, timestamp: Date.now() };
        setChatMessages(prev => [...prev, aiMsg]);
        setIsGenerating(false);
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        let text = '';
        
        try {
            if (mode === 'creative') {
                if (!prompt) return;
                text = await draftFromScratch(prompt, context, files);
            } else if (mode === 'seo') {
                if (!seoTopic) return;
                text = await generateSeoArticle(seoTopic, seoKeywords, seoAudience, seoTone);
                if (selectedCMS && onSetDocCMS) {
                    onSetDocCMS(selectedCMS);
                }
            } else if (mode === 'resume') {
                if (!jobInput || files.length === 0) {
                    alert("Please provide a Job Description/URL AND your current resume file.");
                    setIsGenerating(false);
                    return;
                }
                text = await optimizeResume(jobInput, files);
            }
            
            onDraftInsert(text);
            // Don't close sidebar automatically in some modes, but maybe for draft generation it makes sense.
            // Keeping existing behavior:
            onClose();
            
            // Reset fields
            setPrompt('');
            setContext('');
            setFiles([]);
            setSeoTopic('');
            setJobInput('');
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-[450px] max-w-full bg-nb-paper dark:bg-nb-darkPaper border-l-4 border-black dark:border-white shadow-[-10px_0px_0px_0px_rgba(0,0,0,0.2)] z-50 flex flex-col transition-transform transform">
            <div className="flex justify-between items-center p-6 border-b-2 border-black dark:border-white bg-nb-bg dark:bg-nb-darkBg">
                <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                    {mode === 'chat' && <MessageSquare className="w-5 h-5" />}
                    {mode === 'creative' && <PenTool className="w-5 h-5" />}
                    {mode === 'seo' && <Search className="w-5 h-5" />}
                    {mode === 'resume' && <Briefcase className="w-5 h-5" />}
                    {mode === 'saved' && <Bookmark className="w-5 h-5" />}
                    {mode === 'chat' ? 'Partner Chat' : 'Creation Hub'}
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-black border-2 border-transparent hover:border-black dark:hover:border-white transition-all">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b-2 border-black dark:border-white overflow-x-auto no-scrollbar">
                <button 
                    onClick={() => setMode('chat')}
                    className={`flex-1 py-3 px-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-r-2 border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap ${mode === 'chat' ? 'bg-black text-white dark:bg-white dark:text-black' : ''}`}
                >
                    <MessageSquare className="w-3 h-3" /> Chat
                </button>
                <button 
                    onClick={() => setMode('creative')}
                    className={`flex-1 py-3 px-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-r-2 border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap ${mode === 'creative' ? 'bg-nb-yellow text-black' : ''}`}
                >
                    <PenTool className="w-3 h-3" /> Draft
                </button>
                <button 
                    onClick={() => setMode('seo')}
                    className={`flex-1 py-3 px-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-r-2 border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap ${mode === 'seo' ? 'bg-nb-blue text-black' : ''}`}
                >
                    <Search className="w-3 h-3" /> SEO
                </button>
                <button 
                    onClick={() => setMode('resume')}
                    className={`flex-1 py-3 px-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-r-2 border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap ${mode === 'resume' ? 'bg-nb-green text-black' : ''}`}
                >
                    <Briefcase className="w-3 h-3" /> Resume
                </button>
                <button 
                    onClick={() => setMode('saved')}
                    className={`flex-1 py-3 px-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap ${mode === 'saved' ? 'bg-nb-purple text-white' : ''}`}
                >
                    <Bookmark className="w-3 h-3" /> Saved
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 dark:bg-nb-darkBg">
                
                {/* --- CHAT MODE --- */}
                {mode === 'chat' && (
                    <div className="flex flex-col h-full">
                         <div className="flex-1 space-y-4 pb-4">
                            {chatMessages.map((msg, idx) => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div 
                                        className={`
                                            max-w-[85%] p-4 text-sm font-medium leading-relaxed
                                            ${msg.role === 'user' 
                                                ? 'bg-black text-white dark:bg-white dark:text-black rounded-tl-2xl rounded-tr-sm rounded-bl-2xl rounded-br-2xl shadow-neo' 
                                                : 'bg-white dark:bg-black border-2 border-black dark:border-white rounded-tl-sm rounded-tr-2xl rounded-bl-2xl rounded-br-2xl shadow-neo-sm'
                                            }
                                        `}
                                    >
                                        <div className="whitespace-pre-wrap">{msg.text}</div>
                                        {msg.role === 'model' && (
                                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
                                                <button 
                                                    onClick={() => { navigator.clipboard.writeText(msg.text); }}
                                                    className="text-[10px] font-bold uppercase flex items-center gap-1 hover:text-nb-blue transition-colors"
                                                >
                                                    <Copy className="w-3 h-3" /> Copy
                                                </button>
                                                <button 
                                                    onClick={() => onDraftInsert(msg.text)}
                                                    className="text-[10px] font-bold uppercase flex items-center gap-1 hover:text-nb-green transition-colors"
                                                >
                                                    <ArrowLeft className="w-3 h-3" /> Insert
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                         </div>
                    </div>
                )}

                {/* --- CREATIVE MODE --- */}
                {mode === 'creative' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div>
                            <label className="block font-bold text-sm mb-2 uppercase">Drafting Concept</label>
                            <textarea 
                                className="w-full h-32 p-4 bg-white dark:bg-black border-2 border-black dark:border-white font-mono text-sm resize-none focus:outline-none focus:shadow-neo dark:focus:shadow-neo-dark transition-all"
                                placeholder="Describe what you want to write..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block font-bold text-sm mb-2 uppercase">Context / Background Info</label>
                            <textarea 
                                className="w-full h-24 p-4 bg-white dark:bg-black border-2 border-black dark:border-white font-mono text-sm resize-none focus:outline-none focus:shadow-neo dark:focus:shadow-neo-dark transition-all"
                                placeholder="Paste any background info, research, or context here..."
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* --- SEO CMS MODE --- */}
                {mode === 'seo' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <div className="bg-nb-blue/20 p-4 border-2 border-black dark:border-white mb-4">
                            <p className="text-xs font-bold">Generates high-ranking, structured blog content including meta descriptions.</p>
                        </div>
                        <div>
                            <label className="block font-bold text-sm mb-1 uppercase">Main Topic / Title Idea</label>
                            <input 
                                type="text"
                                className="w-full p-3 bg-white dark:bg-black border-2 border-black dark:border-white font-bold text-sm focus:shadow-neo focus:outline-none"
                                placeholder="e.g. The Future of AI Writing"
                                value={seoTopic}
                                onChange={(e) => setSeoTopic(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block font-bold text-sm mb-1 uppercase">Target Keywords (Comma Sep.)</label>
                            <input 
                                type="text"
                                className="w-full p-3 bg-white dark:bg-black border-2 border-black dark:border-white font-mono text-sm focus:shadow-neo focus:outline-none"
                                placeholder="ai tools, writing software, productivity"
                                value={seoKeywords}
                                onChange={(e) => setSeoKeywords(e.target.value)}
                            />
                        </div>
                         <div>
                            <label className="block font-bold text-sm mb-1 uppercase">Target Audience</label>
                            <input 
                                type="text"
                                className="w-full p-3 bg-white dark:bg-black border-2 border-black dark:border-white font-mono text-sm focus:shadow-neo focus:outline-none"
                                placeholder="e.g. Tech Professionals, Students"
                                value={seoAudience}
                                onChange={(e) => setSeoAudience(e.target.value)}
                            />
                        </div>
                         <div>
                            <label className="block font-bold text-sm mb-1 uppercase">Tone</label>
                            <select 
                                className="w-full p-3 bg-white dark:bg-black border-2 border-black dark:border-white font-bold text-sm focus:shadow-neo focus:outline-none appearance-none"
                                value={seoTone}
                                onChange={(e) => setSeoTone(e.target.value)}
                            >
                                <option>Professional</option>
                                <option>Conversational</option>
                                <option>Authoritative</option>
                                <option>Friendly</option>
                                <option>Witty</option>
                            </select>
                        </div>
                        {/* CMS Connection Selector */}
                        <div>
                            <label className="block font-bold text-sm mb-1 uppercase flex items-center gap-2">
                                <Globe className="w-3 h-3" /> Publish Target
                            </label>
                            <select 
                                className="w-full p-3 bg-white dark:bg-black border-2 border-black dark:border-white font-bold text-sm focus:shadow-neo focus:outline-none appearance-none"
                                value={selectedCMS}
                                onChange={(e) => setSelectedCMS(e.target.value)}
                            >
                                <option value="">None (Draft Only)</option>
                                {cmsConnections.map(conn => (
                                    <option key={conn.id} value={conn.id}>{conn.name} ({conn.platform})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* --- RESUME MODE --- */}
                {mode === 'resume' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                         <div className="bg-nb-green/20 p-4 border-2 border-black dark:border-white mb-4">
                            <p className="text-xs font-bold">Optimizes your resume for a specific job application and drafts a cover letter.</p>
                        </div>
                        <div>
                            <label className="block font-bold text-sm mb-2 uppercase">Job Posting (URL or Description)</label>
                            <textarea 
                                className="w-full h-32 p-4 bg-white dark:bg-black border-2 border-black dark:border-white font-mono text-sm resize-none focus:outline-none focus:shadow-neo dark:focus:shadow-neo-dark transition-all"
                                placeholder="Paste the Job URL or the full Job Description text here..."
                                value={jobInput}
                                onChange={(e) => setJobInput(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* --- SAVED RESOURCES MODE --- */}
                {mode === 'saved' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                         <div className="bg-nb-purple/20 p-4 border-2 border-black dark:border-white mb-4">
                            <p className="text-xs font-bold">Your bookmarked research sources and articles.</p>
                        </div>
                        
                        {savedArticles.length === 0 ? (
                            <div className="text-center py-12 opacity-50">
                                <Bookmark className="w-12 h-12 mx-auto mb-2" />
                                <p className="font-bold uppercase text-sm">No saved articles yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {savedArticles.map((article) => (
                                    <div key={article.uri} className="p-4 bg-white dark:bg-black border-2 border-black dark:border-white shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-transform">
                                        <h4 className="font-bold text-sm mb-1 line-clamp-2 leading-tight">{article.title}</h4>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-[10px] font-bold uppercase bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded-sm text-gray-600 dark:text-gray-400">
                                                {article.domain}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <a 
                                                href={article.uri}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex-1 py-2 bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
                                            >
                                                <ExternalLink className="w-3 h-3" /> Open
                                            </a>
                                            <button 
                                                onClick={() => onRemoveArticle(article.uri)}
                                                className="px-3 py-2 border-2 border-black dark:border-white hover:bg-nb-red hover:text-white transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* --- SHARED FILE ATTACHMENT --- */}
                {(mode === 'creative' || mode === 'resume') && (
                    <div className="pt-4 border-t-2 border-gray-200 dark:border-gray-800">
                        <label className="block font-bold text-sm mb-2 uppercase">
                            {mode === 'resume' ? 'Upload Current Resume (Required)' : 'Context / Reference Files'}
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {files.map((f, i) => (
                                <div key={i} className="flex items-center gap-1 text-xs bg-gray-200 dark:bg-gray-800 border-2 border-black dark:border-gray-600 px-2 py-1 font-bold animate-in zoom-in-50">
                                    <FileText className="w-3 h-3" />
                                    <span className="max-w-[150px] truncate">{f.name}</span>
                                    <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-black dark:border-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors w-full justify-center text-sm font-bold uppercase"
                        >
                            <Paperclip className="w-4 h-4" />
                            <span>{files.length > 0 ? 'Add More Files' : (mode === 'resume' ? 'Upload PDF/Doc' : 'Attach Files')}</span>
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            multiple 
                            accept={mode === 'resume' ? ".pdf,.doc,.docx,.txt" : "image/*,application/pdf,text/plain"}
                            onChange={handleFileChange}
                        />
                    </div>
                )}
            </div>

            {/* Chat Input or Generate Button */}
            {mode === 'chat' ? (
                <div className="p-4 bg-nb-bg dark:bg-nb-darkBg border-t-2 border-black dark:border-white">
                    <div className="relative">
                        <textarea 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            className="w-full p-4 pr-12 bg-white dark:bg-black border-2 border-black dark:border-white font-medium text-sm focus:shadow-neo focus:outline-none resize-none h-16"
                            placeholder="Ask your partner..."
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={!chatInput.trim() || isGenerating}
                            className="absolute right-2 top-2 p-2 bg-black text-white dark:bg-white dark:text-black rounded-sm hover:opacity-80 disabled:opacity-50 transition-opacity"
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                    <div className="text-[10px] text-center mt-2 font-bold uppercase text-gray-400">
                        AI reads your current document context
                    </div>
                </div>
            ) : mode !== 'saved' && (
                <div className="p-6 bg-nb-bg dark:bg-nb-darkBg border-t-2 border-black dark:border-white">
                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating || (mode === 'creative' && !prompt) || (mode === 'seo' && !seoTopic) || (mode === 'resume' && (!jobInput || files.length === 0))}
                        className={`
                            w-full py-4 px-6 border-2 border-black dark:border-white flex items-center justify-center gap-3 font-bold text-lg uppercase tracking-wide
                            shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all
                            ${isGenerating ? 'bg-gray-300 cursor-not-allowed' : (mode === 'seo' ? 'bg-nb-blue' : mode === 'resume' ? 'bg-nb-green' : 'bg-nb-yellow')}
                            text-black
                        `}
                    >
                        {isGenerating ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                <Sparkles className="w-6 h-6" />
                                {mode === 'resume' ? 'Optimize Resume' : 'Generate Draft'}
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};
