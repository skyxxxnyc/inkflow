
import React, { useState, useEffect } from 'react';
import { Wand2, X, ArrowRight, Loader2, Sparkles, Check, AlignLeft, Briefcase, ChevronRight, GraduationCap, Coffee, Scissors, FileText } from 'lucide-react';
import { rewriteSelection } from '../services/geminiService';
import { PromptSettings } from '../types';

interface FloatingMenuProps {
    selectionRect: DOMRect | null;
    selectedText: string;
    fullText: string;
    settings: PromptSettings;
    onClose: () => void;
    onReplace: (newText: string) => void;
}

export const FloatingMenu: React.FC<FloatingMenuProps> = ({ selectionRect, selectedText, fullText, settings, onClose, onReplace }) => {
    const [instruction, setInstruction] = useState('');
    const [isWorking, setIsWorking] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (selectionRect) {
            // Calculate position to center above selection, but keep within viewport
            const menuWidth = 320;
            const left = Math.min(
                Math.max(10, selectionRect.left + (selectionRect.width / 2) - (menuWidth / 2) + window.scrollX),
                window.innerWidth - menuWidth - 20
            );
            
            // Adjust top to sit nicely above the text with space for the arrow
            const top = Math.max(10, selectionRect.top - 280 + window.scrollY); // Adjusted height for more buttons

            setPosition({ top, left });
        }
    }, [selectionRect]);

    const handleAction = async (prompt: string) => {
        if (!prompt) return;
        setIsWorking(true);
        const newText = await rewriteSelection(selectedText, prompt, fullText);
        onReplace(newText);
        setIsWorking(false);
        onClose();
        setInstruction('');
    };

    if (!selectionRect) return null;

    return (
        <div 
            className="fixed z-50 flex flex-col gap-3 w-[320px] bg-white dark:bg-nb-darkPaper border-2 border-black dark:border-white shadow-neo p-3 animate-in fade-in zoom-in-95 duration-200 rounded-sm"
            style={{ top: position.top, left: position.left }}
        >
            <div className="flex items-center justify-between border-b-2 border-gray-100 dark:border-gray-700 pb-2">
                <div className="flex items-center gap-2 text-nb-purple font-black uppercase text-xs tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    Magic Edit
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Manual Input */}
            <div className="relative">
                <input
                    autoFocus
                    type="text"
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAction(instruction)}
                    placeholder="Ask AI to rewrite..."
                    className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 p-2 pr-10 text-sm font-medium focus:border-black dark:focus:border-white focus:outline-none transition-colors"
                />
                <button 
                    onClick={() => handleAction(instruction)}
                    disabled={!instruction || isWorking}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-sm transition-colors"
                >
                    {isWorking ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                </button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
                <button 
                    onClick={() => handleAction(settings.fixGrammar)}
                    disabled={isWorking}
                    className="flex items-center gap-2 px-3 py-2 bg-nb-bg dark:bg-nb-darkBg border border-black dark:border-white hover:bg-nb-yellow dark:hover:bg-nb-yellow hover:text-black transition-colors text-xs font-bold text-left"
                >
                    <Check className="w-3 h-3" /> Fix Grammar
                </button>
                <button 
                    onClick={() => handleAction(settings.shorten)}
                    disabled={isWorking}
                    className="flex items-center gap-2 px-3 py-2 bg-nb-bg dark:bg-nb-darkBg border border-black dark:border-white hover:bg-nb-green dark:hover:bg-nb-green hover:text-black transition-colors text-xs font-bold text-left"
                >
                    <AlignLeft className="w-3 h-3" /> Shorten
                </button>
                <button 
                    onClick={() => handleAction(settings.professional)}
                    disabled={isWorking}
                    className="flex items-center gap-2 px-3 py-2 bg-nb-bg dark:bg-nb-darkBg border border-black dark:border-white hover:bg-nb-blue dark:hover:bg-nb-blue hover:text-black transition-colors text-xs font-bold text-left"
                >
                    <Briefcase className="w-3 h-3" /> Professional
                </button>
                <button 
                    onClick={() => handleAction(settings.expand)}
                    disabled={isWorking}
                    className="flex items-center gap-2 px-3 py-2 bg-nb-bg dark:bg-nb-darkBg border border-black dark:border-white hover:bg-nb-red dark:hover:bg-nb-red hover:text-black transition-colors text-xs font-bold text-left"
                >
                    <ChevronRight className="w-3 h-3" /> Expand
                </button>
                 <button 
                    onClick={() => handleAction(settings.formal)}
                    disabled={isWorking}
                    className="flex items-center gap-2 px-3 py-2 bg-nb-bg dark:bg-nb-darkBg border border-black dark:border-white hover:bg-gray-300 dark:hover:bg-gray-600 hover:text-black transition-colors text-xs font-bold text-left"
                >
                    <GraduationCap className="w-3 h-3" /> Formal
                </button>
                <button 
                    onClick={() => handleAction(settings.casual)}
                    disabled={isWorking}
                    className="flex items-center gap-2 px-3 py-2 bg-nb-bg dark:bg-nb-darkBg border border-black dark:border-white hover:bg-orange-300 dark:hover:bg-orange-400 hover:text-black transition-colors text-xs font-bold text-left"
                >
                    <Coffee className="w-3 h-3" /> Casual
                </button>
                 <button 
                    onClick={() => handleAction(settings.concise)}
                    disabled={isWorking}
                    className="flex items-center gap-2 px-3 py-2 bg-nb-bg dark:bg-nb-darkBg border border-black dark:border-white hover:bg-purple-300 dark:hover:bg-purple-400 hover:text-black transition-colors text-xs font-bold text-left"
                >
                    <Scissors className="w-3 h-3" /> Concise
                </button>
                <button 
                    onClick={() => handleAction(settings.summarize)}
                    disabled={isWorking}
                    className="flex items-center gap-2 px-3 py-2 bg-nb-bg dark:bg-nb-darkBg border border-black dark:border-white hover:bg-teal-300 dark:hover:bg-teal-400 hover:text-black transition-colors text-xs font-bold text-left"
                >
                    <FileText className="w-3 h-3" /> Summarize
                </button>
            </div>

            {/* Visual Arrow/Tail pointing to selection */}
            <div className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-nb-darkPaper border-b-2 border-r-2 border-black dark:border-white transform rotate-45"></div>
        </div>
    );
};
