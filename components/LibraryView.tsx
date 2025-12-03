
import React from 'react';
import { Document, DocumentStatus, CMSConnection, Database } from '../types';
import { Search, MoreHorizontal, FileEdit, Trash2, Globe, Clock, FilePlus, Database as DbIcon, Layout } from 'lucide-react';

interface LibraryViewProps {
    documents: Document[];
    databases: Database[];
    currentDatabaseId: string | null;
    cmsConnections: CMSConnection[];
    onOpenDoc: (id: string) => void;
    onDeleteDoc: (id: string) => void;
    onCreateDoc: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ 
    documents, 
    databases,
    currentDatabaseId,
    cmsConnections, 
    onOpenDoc, 
    onDeleteDoc, 
    onCreateDoc 
}) => {
    const [filter, setFilter] = React.useState('');

    const activeDb = currentDatabaseId ? databases.find(db => db.id === currentDatabaseId) : null;

    const filteredDocs = documents.filter(doc => {
        // Filter by database context
        const matchesDb = currentDatabaseId ? doc.databaseId === currentDatabaseId : true;
        // Filter by search
        const matchesSearch = doc.title.toLowerCase().includes(filter.toLowerCase()) || 
                             doc.content.toLowerCase().includes(filter.toLowerCase());
        
        return matchesDb && matchesSearch;
    });

    const formatDate = (ts: number) => new Date(ts).toLocaleDateString();

    const getCMSName = (id?: string) => {
        if (!id) return null;
        return cmsConnections.find(c => c.id === id)?.name;
    };

    return (
        <div className="flex-1 h-full bg-nb-bg dark:bg-nb-darkBg flex flex-col p-8 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2 text-gray-500 font-bold uppercase text-xs tracking-wider">
                        {activeDb ? <DbIcon className="w-4 h-4" /> : <Layout className="w-4 h-4" />}
                        {activeDb ? 'Database View' : 'Global View'}
                    </div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">
                        {activeDb ? activeDb.name : "All Documents"}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-serif italic">
                        {activeDb ? `Manage content inside ${activeDb.name}.` : "Overview of all your writing."}
                    </p>
                </div>
                <button 
                    onClick={onCreateDoc}
                    className="flex items-center gap-2 px-6 py-3 bg-nb-yellow border-2 border-black shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-sm transition-all font-bold uppercase text-black"
                >
                    <FilePlus className="w-5 h-5" /> New Page
                </button>
            </div>

            {/* Filter Bar */}
            <div className="mb-6 relative max-w-md">
                <Search className="absolute left-3 top-3 w-4 h-4 opacity-50" />
                <input 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-black dark:border-white bg-white dark:bg-black shadow-neo-sm focus:outline-none"
                    placeholder="Search documents..."
                />
            </div>

            {/* Table */}
            <div className="flex-1 border-2 border-black dark:border-white bg-white dark:bg-nb-darkPaper shadow-neo overflow-hidden flex flex-col">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 p-4 border-b-2 border-black dark:border-white bg-gray-100 dark:bg-gray-800 font-bold text-xs uppercase tracking-wider">
                    <div className="col-span-5">Title</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">CMS Target</div>
                    <div className="col-span-2">Last Modified</div>
                    <div className="col-span-1 text-right">Actions</div>
                </div>

                {/* Table Body */}
                <div className="flex-1 overflow-y-auto">
                    {filteredDocs.length === 0 ? (
                        <div className="p-8 text-center opacity-50 italic">
                            No documents found {activeDb ? `in ${activeDb.name}` : ''}.
                        </div>
                    ) : (
                        filteredDocs.map(doc => (
                            <div 
                                key={doc.id} 
                                className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors items-center group"
                            >
                                <div className="col-span-5 font-serif font-medium truncate pr-4 cursor-pointer hover:underline" onClick={() => onOpenDoc(doc.id)}>
                                    {doc.title || "Untitled Page"}
                                </div>
                                <div className="col-span-2">
                                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${
                                        doc.status === DocumentStatus.PUBLISHED ? 'bg-nb-green border-black text-black' :
                                        doc.status === DocumentStatus.IN_REVIEW ? 'bg-nb-yellow border-black text-black' :
                                        'bg-gray-200 border-gray-400 text-gray-600'
                                    }`}>
                                        {doc.status}
                                    </span>
                                </div>
                                <div className="col-span-2 flex items-center gap-1 text-xs opacity-70">
                                    {doc.cmsConnectionId ? (
                                        <>
                                            <Globe className="w-3 h-3" />
                                            {getCMSName(doc.cmsConnectionId)}
                                        </>
                                    ) : (
                                        <span className="text-gray-300">-</span>
                                    )}
                                </div>
                                <div className="col-span-2 flex items-center gap-1 text-xs opacity-60">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(doc.updatedAt)}
                                </div>
                                <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => onOpenDoc(doc.id)} className="p-1 hover:text-nb-blue">
                                        <FileEdit className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => onDeleteDoc(doc.id)} className="p-1 hover:text-nb-red">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};