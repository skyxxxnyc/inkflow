
import React from 'react';
import { Layout, Plus, Settings, Globe, Database, FileText, ChevronRight } from 'lucide-react';
import { Document, CMSConnection } from '../types';

interface NavigationSidebarProps {
    documents: Document[];
    currentDocId: string | null;
    onSelectDoc: (id: string) => void;
    onCreateDoc: () => void;
    onGoToLibrary: () => void;
    onOpenCMSSettings: () => void;
    cmsConnections: CMSConnection[];
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ 
    documents, 
    currentDocId, 
    onSelectDoc, 
    onCreateDoc, 
    onGoToLibrary, 
    onOpenCMSSettings,
    cmsConnections
}) => {
    // Group recent docs
    const recentDocs = [...documents].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);

    return (
        <div className="w-64 bg-gray-50 dark:bg-nb-darkBg border-r-2 border-black dark:border-white flex flex-col h-full shrink-0">
            {/* Logo Area */}
            <div className="h-16 flex items-center px-4 border-b-2 border-black dark:border-white bg-nb-paper dark:bg-nb-darkPaper">
                 <div className="w-8 h-8 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black rounded-sm mr-3">
                    IF
                 </div>
                 <span className="font-bold tracking-tighter uppercase text-lg">InkFlow</span>
            </div>

            {/* Main Nav */}
            <div className="p-4 space-y-2">
                <button 
                    onClick={onGoToLibrary}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm border-2 border-transparent transition-all ${!currentDocId ? 'bg-nb-yellow border-black shadow-neo-sm font-bold' : 'hover:bg-gray-200 dark:hover:bg-gray-800'}`}
                >
                    <Database className="w-4 h-4" />
                    <span className="text-sm uppercase tracking-wide">Library</span>
                </button>
            </div>

            {/* Pages Section */}
            <div className="flex-1 overflow-y-auto px-4 py-2">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-gray-500">Recent Pages</span>
                    <button onClick={onCreateDoc} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-sm">
                        <Plus className="w-3 h-3" />
                    </button>
                </div>
                
                <div className="space-y-1">
                    {recentDocs.map(doc => (
                        <button
                            key={doc.id}
                            onClick={() => onSelectDoc(doc.id)}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm transition-colors border-l-2 ${currentDocId === doc.id ? 'bg-white dark:bg-gray-800 border-nb-purple font-bold' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-400'}`}
                        >
                            <FileText className="w-3 h-3 shrink-0" />
                            <span className="truncate">{doc.title || "Untitled"}</span>
                        </button>
                    ))}
                    {recentDocs.length === 0 && (
                        <div className="text-xs opacity-40 italic px-2">No pages yet</div>
                    )}
                </div>

                {/* CMS Connections List (Read Only View) */}
                <div className="mt-8">
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase text-gray-500">CMS Linked</span>
                        <button onClick={onOpenCMSSettings} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-sm">
                            <Settings className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="space-y-1">
                        {cmsConnections.map(conn => (
                            <div key={conn.id} className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400">
                                <div className={`w-2 h-2 rounded-full ${conn.url ? 'bg-green-500' : 'bg-gray-300'}`} />
                                <span className="truncate">{conn.name}</span>
                            </div>
                        ))}
                         {cmsConnections.length === 0 && (
                            <button onClick={onOpenCMSSettings} className="text-xs opacity-50 hover:opacity-100 underline decoration-dashed px-2">
                                + Connect CMS
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t-2 border-black dark:border-white bg-nb-bg dark:bg-nb-darkBg">
                <button 
                    onClick={onOpenCMSSettings}
                    className="flex items-center gap-2 text-xs font-bold uppercase hover:text-nb-blue transition-colors"
                >
                    <Globe className="w-4 h-4" /> Manage Connections
                </button>
            </div>
        </div>
    );
};
