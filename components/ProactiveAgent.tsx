import React, { useEffect, useState } from 'react';
import { Lightbulb, X, Search, Check, ArrowRight, ChevronDown, ExternalLink, Globe, RotateCcw, Bookmark } from 'lucide-react';
import { getSmartSuggestions, checkFacts } from '../services/geminiService';
import { Suggestion, Article } from '../types';

interface ProactiveAgentProps {
    currentText: string;
    onApplySuggestion: (original: string, replacement: string) => void;
    canUndo: boolean;
    onUndo: () => void;
    savedArticles: Article[];
    onSaveArticle: (article: Article) => void;
}

const NewsCard: React.FC<{ chunk: any, isSaved: boolean, onToggleSave: (article: Article) => void }> = ({ chunk, isSaved, onToggleSave }) => {
    const [expanded, setExpanded] = useState(false);
    
    // Safe domain extraction
    let domain = "Source";
    try {
        domain = new URL(chunk.web.uri).hostname.replace('www.', '');
    } catch (e) {}

    const articleData: Article = {
        title: chunk.web.title || "Untitled Source",
        uri: chunk.web.uri,
        domain
    };

    return (
        <div 
            className={`border-2 border-black dark:border-white bg-white dark:bg-nb-darkBg transition-all hover:shadow-neo-sm group ${expanded ? 'shadow-neo-sm' : ''}`}
        >
            <div 
                className="p-3 flex justify-between items-start gap-3 cursor-pointer select-none"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-start gap-2 flex-1 overflow-hidden">
                    <div className="mt-0.5 min-w-[16px] flex-shrink-0">
                         <Globe className="w-3 h-3 text-nb-blue" />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <h5 className="font-bold text-xs leading-snug text-black dark:text-white group-hover:underline decoration-2 underline-offset-2 truncate">
                            {chunk.web.title || "Untitled Source"}
                        </h5>
                         <div className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1 truncate">
                            {domain}
                            {!expanded && <span className="opacity-50 hidden sm:inline">• Click to expand</span>}
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-1 flex-shrink-0">
                     <button 
                        onClick={(e) => { e.stopPropagation(); onToggleSave(articleData); }}
                        className={`p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-sm ${isSaved ? 'text-nb-purple' : 'text-gray-400 hover:text-nb-purple'}`}
                        title={isSaved ? "Remove from Saved" : "Save for Later"}
                    >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                    </button>
                    <div className="text-black dark:text-white opacity-50 p-1">
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            </div>

            {expanded && (
                <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-2">
                    <div className="pt-3 border-t-2 border-dashed border-gray-100 dark:border-gray-700">
                        {/* Try to show snippet if available in the chunk object - falling back to title if no snippet */}
                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 leading-relaxed font-serif">
                            {chunk.web.snippet || chunk.web.content || "No preview available for this source."}
                        </p>
                        
                        <div className="bg-gray-50 dark:bg-black p-2 mb-3 border border-gray-100 dark:border-gray-800 flex items-center gap-2" title={chunk.web.uri}>
                             <div className="flex-1 truncate text-[10px] font-mono text-gray-500">
                                {chunk.web.uri}
                             </div>
                        </div>

                        <a 
                            href={chunk.web.uri}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-2 bg-black text-white dark:bg-white dark:text-black font-bold text-xs uppercase hover:opacity-80 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ExternalLink className="w-3 h-3" />
                            Read Full Article
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

export const ProactiveAgent: React.FC<ProactiveAgentProps> = ({ currentText, onApplySuggestion, canUndo, onUndo, savedArticles, onSaveArticle }) => {
    const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
    const [loading, setLoading] = useState(false);
    const [factCheck, setFactCheck] = useState<{text: string, grounding?: any} | null>(null);
    const [isPaused, setIsPaused] = useState(false);

    // Debounce the analysis
    useEffect(() => {
        if (isPaused) return;

        const timer = setTimeout(async () => {
            // Only analyze if text exists and changed recently
            // Increased threshold to 200 chars and 8s wait time to be less intrusive
            if (currentText.length > 200) {
                setLoading(true);
                const result = await getSmartSuggestions(currentText);
                if (result) {
                    setSuggestion({
                        id: Date.now().toString(),
                        text: result.suggestion,
                        originalText: result.originalText,
                        rationale: result.rationale,
                        type: result.type as any
                    });
                }
                setLoading(false);
            }
        }, 8000); // Wait 8 seconds of idle time to be less intrusive

        return () => clearTimeout(timer);
    }, [currentText, isPaused]);

    const runFactCheck = async () => {
        setLoading(true);
        const result = await checkFacts(currentText.slice(-1500)); 
        setFactCheck(result);
        setLoading(false);
    };

    const handleAccept = () => {
        if (suggestion) {
            onApplySuggestion(suggestion.originalText, suggestion.text);
            setSuggestion(null);
            // Pause briefly after applying to avoid immediate re-trigger
            setIsPaused(true);
            setTimeout(() => setIsPaused(false), 5000);
        }
    };

    return (
        <div className="fixed bottom-8 right-8 flex flex-col items-end gap-4 pointer-events-none z-40">
            {/* Control Buttons */}
            <div className="pointer-events-auto flex items-center gap-3">
                 {canUndo && (
                    <button
                        onClick={onUndo}
                        className="flex items-center gap-2 px-4 py-2 bg-black text-white dark:bg-white dark:text-black border-2 border-black dark:border-white shadow-neo hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-neo-sm transition-all font-bold text-sm"
                    >
                        <RotateCcw className="w-4 h-4" /> Undo
                    </button>
                 )}
                 <button 
                    onClick={runFactCheck}
                    className="flex items-center gap-2 px-4 py-2 bg-nb-blue border-2 border-black dark:border-white shadow-neo hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-neo-sm transition-all font-bold text-sm text-black"
                >
                    {loading ? <span className="animate-pulse">Thinking...</span> : <><Search className="w-4 h-4" /> Fact Check</>}
                </button>
            </div>

             {/* Fact Check Result */}
             {factCheck && (
                 <div className="w-96 bg-nb-paper dark:bg-nb-darkPaper border-2 border-black dark:border-white shadow-neo p-4 pointer-events-auto animate-in slide-in-from-right duration-300 max-h-[80vh] flex flex-col">
                    <div className="flex justify-between items-start mb-4 border-b-2 border-black dark:border-white pb-2">
                         <h4 className="font-black uppercase text-sm tracking-wider text-black dark:text-white flex items-center gap-2">
                            <Search className="w-4 h-4" /> Research Agent
                         </h4>
                         <button onClick={() => setFactCheck(null)} className="hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black p-1 transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                    
                    <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar">
                        <div className="prose prose-sm dark:prose-invert leading-snug text-sm mb-6 font-serif">
                            {factCheck.text}
                        </div>

                        {factCheck.grounding?.groundingChunks?.length > 0 && (
                            <div className="space-y-3">
                                <h6 className="font-bold text-xs uppercase tracking-widest text-gray-500 mb-2">Sources & Citations</h6>
                                {factCheck.grounding.groundingChunks.map((chunk: any, i: number) => (
                                    chunk.web?.uri && (
                                        <NewsCard 
                                            key={i} 
                                            chunk={chunk} 
                                            isSaved={savedArticles.some(a => a.uri === chunk.web.uri)}
                                            onToggleSave={onSaveArticle}
                                        />
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                 </div>
             )}

            {/* Proactive Suggestion Bubble */}
            {suggestion && !loading && (
                <div className="w-96 bg-nb-paper dark:bg-nb-darkPaper border-2 border-black dark:border-white shadow-neo p-0 pointer-events-auto animate-in slide-in-from-right duration-300 overflow-hidden flex flex-col">
                    <div className={`px-4 py-2 border-b-2 border-black dark:border-white flex justify-between items-center ${
                                suggestion.type === 'grammar' ? 'bg-nb-red' :
                                suggestion.type === 'creative' ? 'bg-nb-purple text-white' : 'bg-nb-yellow'
                            }`}>
                        <div className="flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" />
                            <span className="font-bold uppercase text-xs tracking-wider">
                                {suggestion.type} Suggestion
                            </span>
                        </div>
                        <button onClick={() => setSuggestion(null)} className="hover:opacity-50">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <div className="p-4 bg-white dark:bg-nb-darkBg">
                        <p className="text-xs font-bold mb-3 text-gray-500 uppercase tracking-wide">{suggestion.rationale}</p>
                        
                        <div className="flex flex-col gap-2 text-sm font-mono bg-gray-50 dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700">
                            <div className="line-through opacity-50 text-red-500 decoration-2">{suggestion.originalText}</div>
                            <div className="flex items-center gap-2 text-nb-green">
                                <ArrowRight className="w-3 h-3" />
                                <span className="font-bold">{suggestion.text}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex border-t-2 border-black dark:border-white">
                        <button 
                            onClick={() => setSuggestion(null)}
                            className="flex-1 py-3 font-bold text-xs uppercase hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-r-2 border-black dark:border-white"
                        >
                            Ignore
                        </button>
                        <button 
                            onClick={handleAccept}
                            className="flex-1 py-3 bg-black text-white dark:bg-white dark:text-black font-bold text-xs uppercase hover:opacity-80 transition-opacity flex items-center justify-center gap-2"
                        >
                            <Check className="w-4 h-4" />
                            Accept
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};