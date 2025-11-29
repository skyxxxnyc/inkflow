
import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';
import { PromptSettings, DEFAULT_PROMPT_SETTINGS } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: PromptSettings;
    onSave: (newSettings: PromptSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
    const [localSettings, setLocalSettings] = useState<PromptSettings>(settings);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings, isOpen]);

    const handleChange = (key: keyof PromptSettings, value: string) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleReset = () => {
        setLocalSettings(DEFAULT_PROMPT_SETTINGS);
    };

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-nb-paper dark:bg-nb-darkPaper border-4 border-black dark:border-white shadow-neo w-full max-w-lg animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b-2 border-black dark:border-white bg-nb-yellow">
                    <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2 text-black">
                        Customize AI Prompts
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-black/10 rounded-sm transition-colors text-black">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        Modify the default prompts sent to Gemini when you use the magic buttons in the inline editor.
                    </p>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider">Fix Grammar Action</label>
                        <input 
                            type="text" 
                            value={localSettings.fixGrammar}
                            onChange={(e) => handleChange('fixGrammar', e.target.value)}
                            className="w-full p-2 border-2 border-black dark:border-white bg-white dark:bg-nb-darkBg focus:shadow-neo-sm focus:outline-none transition-shadow"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider">Shorten Action</label>
                        <input 
                            type="text" 
                            value={localSettings.shorten}
                            onChange={(e) => handleChange('shorten', e.target.value)}
                            className="w-full p-2 border-2 border-black dark:border-white bg-white dark:bg-nb-darkBg focus:shadow-neo-sm focus:outline-none transition-shadow"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider">Professional Action</label>
                        <input 
                            type="text" 
                            value={localSettings.professional}
                            onChange={(e) => handleChange('professional', e.target.value)}
                            className="w-full p-2 border-2 border-black dark:border-white bg-white dark:bg-nb-darkBg focus:shadow-neo-sm focus:outline-none transition-shadow"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider">Expand Action</label>
                        <input 
                            type="text" 
                            value={localSettings.expand}
                            onChange={(e) => handleChange('expand', e.target.value)}
                            className="w-full p-2 border-2 border-black dark:border-white bg-white dark:bg-nb-darkBg focus:shadow-neo-sm focus:outline-none transition-shadow"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider">Formal Action</label>
                        <input 
                            type="text" 
                            value={localSettings.formal}
                            onChange={(e) => handleChange('formal', e.target.value)}
                            className="w-full p-2 border-2 border-black dark:border-white bg-white dark:bg-nb-darkBg focus:shadow-neo-sm focus:outline-none transition-shadow"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider">Casual Action</label>
                        <input 
                            type="text" 
                            value={localSettings.casual}
                            onChange={(e) => handleChange('casual', e.target.value)}
                            className="w-full p-2 border-2 border-black dark:border-white bg-white dark:bg-nb-darkBg focus:shadow-neo-sm focus:outline-none transition-shadow"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider">Concise Action</label>
                        <input 
                            type="text" 
                            value={localSettings.concise}
                            onChange={(e) => handleChange('concise', e.target.value)}
                            className="w-full p-2 border-2 border-black dark:border-white bg-white dark:bg-nb-darkBg focus:shadow-neo-sm focus:outline-none transition-shadow"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider">Summarize Action</label>
                        <input 
                            type="text" 
                            value={localSettings.summarize}
                            onChange={(e) => handleChange('summarize', e.target.value)}
                            className="w-full p-2 border-2 border-black dark:border-white bg-white dark:bg-nb-darkBg focus:shadow-neo-sm focus:outline-none transition-shadow"
                        />
                    </div>
                </div>

                <div className="p-4 border-t-2 border-black dark:border-white flex gap-2 justify-end bg-gray-50 dark:bg-gray-900">
                    <button 
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-black dark:border-white text-xs font-bold uppercase hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" /> Reset
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2 bg-nb-green border-2 border-black dark:border-white shadow-neo hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-neo-sm text-black text-sm font-bold uppercase transition-all"
                    >
                        <Save className="w-4 h-4" /> Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
