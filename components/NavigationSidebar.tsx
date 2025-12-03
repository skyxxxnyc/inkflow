
import React, { useState } from 'react';
import { Layout, Plus, Settings, Globe, Database as DbIcon, FileText, ChevronRight, X, Trash2, LogOut, User as UserIcon } from 'lucide-react';
import { Document, CMSConnection, Database, User } from '../types';

interface NavigationSidebarProps {
    documents: Document[];
    databases: Database[];
    currentDocId: string | null;
    currentDatabaseId: string | null;
    user: User | null;
    onSelectDoc: (id: string) => void;
    onSelectDatabase: (id: string) => void;
    onCreateDoc: () => void;
    onCreateDatabase: (name: string) => void;
    onDeleteDatabase: (id: string) => void;
    onGoToLibrary: () => void;
    onOpenCMSSettings: () => void;
    onLogout: () => void;
    cmsConnections: CMSConnection[];
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ 
    documents, 
    databases,
    currentDocId, 
    currentDatabaseId,
    user,
    onSelectDoc, 
    onSelectDatabase,
    onCreateDoc, 
    onCreateDatabase,
    onDeleteDatabase,
    onGoToLibrary, 
    onOpenCMSSettings,
    onLogout,
    cmsConnections
}) => {
    const [isCreatingDb, setIsCreatingDb] = useState(false);
    const [newDbName, setNewDbName] = useState('');

    const handleNewDbSubmit = () => {
        if (newDbName.trim()) {
            onCreateDatabase(newDbName);
            setNewDbName('');
            setIsCreatingDb(false);
        }
    };

    // Group recent docs (filtered by current context/database potentially, but keep global recents for now or contextual?)
    // Let's keep recents as global for easy access.
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
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm border-2 border-transparent transition-all ${!currentDocId && !currentDatabaseId ? 'bg-nb-yellow border-black shadow-neo-sm font-bold' : 'hover:bg-gray-200 dark:hover:bg-gray-800'}`}
                >
                    <Layout className="w-4 h-4" />
                    <span className="text-sm uppercase tracking-wide">All Docs</span>
                </button>
            </div>

            {/* Databases Section */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase text-gray-500 flex items-center gap-1">
                            <DbIcon className="w-3 h-3" /> Databases
                        </span>
                        <button onClick={() => setIsCreatingDb(true)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-sm">
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="space-y-1">
                        {databases.map(db => (
                            <div key={db.id} className="group flex items-center justify-between pr-2">
                                <button
                                    onClick={() => onSelectDatabase(db.id)}
                                    className={`flex-1 flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm transition-colors text-left ${currentDatabaseId === db.id ? 'font-bold text-black dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
                                >
                                    <span className="truncate">{db.name}</span>
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDeleteDatabase(db.id); }}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-nb-red transition-opacity"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}

                        {isCreatingDb && (
                            <div className="flex items-center gap-1 px-1 animate-in fade-in slide-in-from-left-2">
                                <input 
                                    autoFocus
                                    className="w-full text-sm bg-white dark:bg-black border border-black dark:border-white px-2 py-1 focus:outline-none"
                                    placeholder="Name..."
                                    value={newDbName}
                                    onChange={e => setNewDbName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleNewDbSubmit()}
                                    onBlur={() => { if(!newDbName) setIsCreatingDb(false); }}
                                />
                                <button onClick={() => setIsCreatingDb(false)}><X className="w-3 h-3 hover:text-red-500"/></button>
                            </div>
                        )}
                        
                        {databases.length === 0 && !isCreatingDb && (
                            <div className="text-xs opacity-40 italic px-2">No databases</div>
                        )}
                    </div>
                </div>

                {/* Recent Pages */}
                <div>
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
                </div>

                {/* CMS Connections */}
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

            {/* User Profile Footer */}
            <div className="p-4 border-t-2 border-black dark:border-white bg-nb-paper dark:bg-nb-darkPaper">
                {user ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-black dark:border-white bg-gray-200" />
                            <div className="flex flex-col truncate">
                                <span className="text-xs font-bold truncate">{user.name}</span>
                                <span className="text-[10px] opacity-60 truncate">{user.email}</span>
                            </div>
                        </div>
                        <button 
                            onClick={onLogout}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm text-gray-500 hover:text-red-500 transition-colors"
                            title="Sign Out"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-xs font-bold uppercase opacity-50">
                        <UserIcon className="w-4 h-4" /> Guest
                    </div>
                )}
            </div>
            
            {/* CMS Manage Link */}
            <div className="px-4 pb-2 bg-nb-bg dark:bg-nb-darkBg border-t border-gray-200 dark:border-gray-800 pt-2">
                 <button 
                    onClick={onOpenCMSSettings}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase hover:text-nb-blue transition-colors text-gray-400 w-full justify-center"
                >
                    <Globe className="w-3 h-3" /> Manage Connections
                </button>
            </div>
        </div>
    );
};
