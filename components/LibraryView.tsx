
import React from 'react';
import { Document, DocumentStatus, CMSConnection, Database } from '../types';
import { Search, MoreHorizontal, FileEdit, Trash2, Globe, Clock, FilePlus, Database as DbIcon, Layout, Copy, LayoutGrid } from 'lucide-react';

interface LibraryViewProps {
    documents: Document[];
    databases: Database[];
    currentDatabaseId: string | null;
    cmsConnections: CMSConnection[];
    onOpenDoc: (id: string) => void;
    onDeleteDoc: (id: string) => void;
    onCreateDoc: () => void;
    onOpenTemplates: () => void;
    onUpdateDatabaseView: (id: string, viewType: 'TABLE' | 'GALLERY' | 'LIST') => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
    documents,
    databases,
    currentDatabaseId,
    cmsConnections,
    onOpenDoc,
    onDeleteDoc,
    onCreateDoc,
    onOpenTemplates,
    onUpdateDatabaseView
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

    const viewType = activeDb?.viewType || 'TABLE';

    const renderHeader = () => (
        <div className="flex justify-between items-end mb-8">
            <div>
                <div className="flex items-center gap-2 mb-2 text-gray-500 font-bold uppercase text-xs tracking-wider">
                    {activeDb ? <DbIcon className="w-4 h-4" /> : <Layout className="w-4 h-4" />}
                    {activeDb ? 'Database View' : 'Global View'}
                </div>
                <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 flex items-center gap-4">
                    {activeDb ? (
                        <>
                            <div className="w-8 h-8 border-4 border-black dark:border-white" style={{ backgroundColor: activeDb.color }} />
                            {activeDb.name}
                        </>
                    ) : (
                        "All Documents"
                    )}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 font-serif italic">
                    {activeDb ? `Manage content inside ${activeDb.name}.` : "Overview of all your writing."}
                </p>

                {/* View Toggles (Database Specific) */}
                {activeDb && (
                    <div className="flex gap-1 mt-4 border-2 border-black dark:border-white p-1 bg-white dark:bg-black w-fit">
                        <button
                            onClick={() => onUpdateDatabaseView(activeDb.id, 'TABLE')}
                            className={`px-3 py-1 text-[10px] font-bold uppercase flex items-center gap-2 ${viewType === 'TABLE' ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        >
                            <Layout className="w-3 h-3" /> Table
                        </button>
                        <button
                            onClick={() => onUpdateDatabaseView(activeDb.id, 'GALLERY')}
                            className={`px-3 py-1 text-[10px] font-bold uppercase flex items-center gap-2 ${viewType === 'GALLERY' ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        >
                            <LayoutGrid className="w-3 h-3" /> Gallery
                        </button>
                        <button
                            onClick={() => onUpdateDatabaseView(activeDb.id, 'LIST')}
                            className={`px-3 py-1 text-[10px] font-bold uppercase flex items-center gap-2 ${viewType === 'LIST' ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        >
                            <Search className="w-3 h-3" /> List
                        </button>
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <button
                    onClick={onOpenTemplates}
                    className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-black border-2 border-black dark:border-white shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-sm transition-all font-bold uppercase text-black dark:text-white"
                >
                    <Copy className="w-5 h-5" /> Templates
                </button>
                <button
                    onClick={onCreateDoc}
                    className="flex items-center gap-2 px-6 py-3 bg-nb-yellow border-2 border-black shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-sm transition-all font-bold uppercase text-black"
                >
                    <FilePlus className="w-5 h-5" /> New Page
                </button>
            </div>
        </div>
    );

    const renderGallery = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-8">
            {filteredDocs.map(doc => (
                <div
                    key={doc.id}
                    onClick={() => onOpenDoc(doc.id)}
                    className="group relative bg-white dark:bg-nb-darkPaper border-4 border-black dark:border-white shadow-neo hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer flex flex-col h-[280px]"
                >
                    {/* Cover */}
                    <div className="h-32 bg-gray-100 dark:bg-gray-800 border-b-4 border-black dark:border-white overflow-hidden relative">
                        {doc.cover ? (
                            <img src={doc.cover} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-10">
                                <FileEdit className="w-12 h-12" />
                            </div>
                        )}
                        <div className="absolute bottom-2 left-2 flex gap-1">
                            <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white">
                                {doc.status}
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                            {doc.icon ? <span className="text-xl">{doc.icon}</span> : <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700" />}
                            <h3 className="font-black uppercase text-sm line-clamp-2 leading-tight">{doc.title || "Untitled"}</h3>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-serif italic line-clamp-3 mb-2 flex-1">
                            {doc.content.substring(0, 100).replace(/[#*`]/g, '')}...
                        </p>
                        <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formatDate(doc.updatedAt)}</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteDoc(doc.id); }}
                                    className="p-1 hover:text-nb-red"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderTable = () => (
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
                {filteredDocs.map(doc => (
                    <div
                        key={doc.id}
                        className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors items-center group"
                    >
                        <div className="col-span-5 font-serif font-medium truncate pr-4 cursor-pointer hover:underline flex items-center gap-2" onClick={() => onOpenDoc(doc.id)}>
                            {doc.icon && <span>{doc.icon}</span>}
                            {doc.title || "Untitled Page"}
                        </div>
                        <div className="col-span-2">
                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${doc.status === DocumentStatus.PUBLISHED ? 'bg-nb-green border-black text-black' :
                                doc.status === DocumentStatus.IN_REVIEW ? 'bg-nb-yellow border-black text-black' :
                                    'bg-gray-200 border-gray-400 text-gray-600 shadow-none'
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
                ))}
            </div>
        </div>
    );

    const renderList = () => (
        <div className="space-y-2 overflow-y-auto">
            {filteredDocs.map(doc => (
                <div
                    key={doc.id}
                    onClick={() => onOpenDoc(doc.id)}
                    className="p-3 bg-white dark:bg-nb-darkPaper border-2 border-black dark:border-white flex items-center justify-between hover:bg-nb-yellow hover:text-black transition-colors cursor-pointer group"
                >
                    <div className="flex items-center gap-3">
                        {doc.icon ? <span>{doc.icon}</span> : <FileEdit className="w-4 h-4 opacity-30" />}
                        <span className="font-bold uppercase text-sm tracking-tight">{doc.title || "Untitled"}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">
                        <span>{doc.status}</span>
                        <span>{formatDate(doc.updatedAt)}</span>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="flex-1 h-full bg-nb-bg dark:bg-nb-darkBg flex flex-col p-8 overflow-hidden">
            {renderHeader()}

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

            {filteredDocs.length === 0 ? (
                <div className="p-8 text-center opacity-50 italic border-2 border-dashed border-black dark:border-white">
                    No documents found {activeDb ? `in ${activeDb.name}` : ''}.
                </div>
            ) : (
                viewType === 'GALLERY' ? renderGallery() :
                    viewType === 'LIST' ? renderList() :
                        renderTable()
            )}
        </div>
    );
};
