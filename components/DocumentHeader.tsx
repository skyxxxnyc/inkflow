
import React from 'react';
import { Document, DocumentStatus, CMSConnection } from '../types';
import { Image as ImageIcon, Smile, Globe, Clock, Tag, Plus, Trash2 } from 'lucide-react';

interface DocumentHeaderProps {
    doc: Document;
    cmsConnections: CMSConnection[];
    onUpdateDoc: (id: string, updates: Partial<Document>) => void;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({ doc, cmsConnections, onUpdateDoc }) => {
    const handleUpdateTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdateDoc(doc.id, { title: e.target.value });
    };

    const handleAddCover = () => {
        const url = prompt('Enter image URL for cover:');
        if (url) onUpdateDoc(doc.id, { cover: url });
    };

    const handleAddIcon = () => {
        const icon = prompt('Enter emoji for icon:');
        if (icon) onUpdateDoc(doc.id, { icon });
    };

    const handleUpdateStatus = (status: DocumentStatus) => {
        onUpdateDoc(doc.id, { status });
    };

    const getCMSName = (id?: string) => {
        if (!id) return null;
        return cmsConnections.find(c => c.id === id)?.name;
    };

    const handleAddProperty = () => {
        const key = prompt('Property name:');
        if (key) {
            onUpdateDoc(doc.id, {
                properties: { ...doc.properties, [key]: '' }
            });
        }
    };

    const handleUpdateProperty = (key: string, value: string) => {
        onUpdateDoc(doc.id, {
            properties: { ...doc.properties, [key]: value }
        });
    };

    const handleRemoveProperty = (key: string) => {
        const next = { ...doc.properties };
        delete next[key];
        onUpdateDoc(doc.id, { properties: next });
    };

    return (
        <div className="w-full mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Cover Image */}
            <div className="group relative w-full h-[240px] bg-gray-100 dark:bg-gray-800 border-b-4 border-black dark:border-white overflow-hidden mb-8">
                {doc.cover ? (
                    <>
                        <img src={doc.cover} className="w-full h-full object-cover" alt="Cover" />
                        <button
                            onClick={handleAddCover}
                            className="absolute bottom-4 right-4 bg-white/80 dark:bg-black/80 backdrop-blur-sm border-2 border-black dark:border-white px-3 py-1.5 text-xs font-bold uppercase hover:bg-white dark:hover:bg-black transition-colors opacity-0 group-hover:opacity-100"
                        >
                            Change Cover
                        </button>
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <button
                            onClick={handleAddCover}
                            className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-400 text-gray-400 hover:border-black hover:text-black dark:hover:border-white dark:hover:text-white transition-all font-bold uppercase text-sm"
                        >
                            <ImageIcon className="w-4 h-4" /> Add Cover
                        </button>
                    </div>
                )}
            </div>

            <div className="px-8 max-w-5xl mx-auto relative">
                {/* Icon */}
                <div className="absolute -top-16 left-8 group">
                    {doc.icon ? (
                        <div
                            onClick={handleAddIcon}
                            className="text-7xl cursor-pointer hover:scale-110 transition-transform bg-nb-paper dark:bg-nb-darkPaper rounded-xl p-2"
                        >
                            {doc.icon}
                        </div>
                    ) : (
                        <button
                            onClick={handleAddIcon}
                            className="w-16 h-16 bg-white dark:bg-black border-4 border-black dark:border-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-100 shadow-neo-sm"
                        >
                            <Smile className="w-8 h-8" />
                        </button>
                    )}
                </div>

                <div className="mt-8 space-y-6">
                    {/* Title */}
                    <input
                        value={doc.title}
                        onChange={handleUpdateTitle}
                        placeholder="Untitled Page"
                        className="w-full text-5xl font-black uppercase tracking-tighter bg-transparent border-none focus:ring-0 outline-none placeholder:opacity-20"
                    />

                    {/* Meta Properties Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-y-2 border-black/10 dark:border-white/10">
                        <div className="space-y-1">
                            <div className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Status
                            </div>
                            <select
                                value={doc.status}
                                onChange={(e) => handleUpdateStatus(e.target.value as DocumentStatus)}
                                className="w-full bg-nb-yellow border-2 border-black text-xs font-bold uppercase px-3 py-1.5 shadow-neo-sm outline-none cursor-pointer"
                            >
                                <option value={DocumentStatus.DRAFT}>{DocumentStatus.DRAFT}</option>
                                <option value={DocumentStatus.IN_REVIEW}>{DocumentStatus.IN_REVIEW}</option>
                                <option value={DocumentStatus.PUBLISHED}>{DocumentStatus.PUBLISHED}</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <div className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-1">
                                <Globe className="w-3 h-3" /> CMS Connection
                            </div>
                            <div className="text-xs font-bold uppercase border-2 border-black dark:border-white px-3 py-1.5 bg-gray-50 dark:bg-gray-900">
                                {doc.cmsConnectionId ? getCMSName(doc.cmsConnectionId) : "Not Connected"}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-1">
                                <Tag className="w-3 h-3" /> Tags
                            </div>
                            <div className="flex flex-wrap gap-1 min-h-[34px] items-center">
                                {doc.tags.length > 0 ? doc.tags.map(t => (
                                    <span key={t} className="text-[10px] font-bold bg-gray-100 dark:bg-gray-800 px-2 py-0.5 border border-black dark:border-white">
                                        {t}
                                    </span>
                                )) : <span className="text-[10px] opacity-30 italic">No tags</span>}
                            </div>
                        </div>
                    </div>

                    {/* Custom Properties */}
                    <div className="space-y-4 pb-12">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-500">Properties</h4>
                            <button
                                onClick={handleAddProperty}
                                className="flex items-center gap-1 text-[10px] font-bold uppercase bg-black text-white dark:bg-white dark:text-black px-2 py-1 hover:scale-105 transition-transform"
                            >
                                <Plus className="w-3 h-3" /> Property
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(doc.properties).map(([key, value]) => (
                                <div key={key} className="group flex flex-col border-2 border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white transition-colors p-3 bg-white dark:bg-nb-darkPaper shadow-sm hover:shadow-neo-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-black uppercase text-gray-400">{key}</span>
                                        <button
                                            onClick={() => handleRemoveProperty(key)}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-nb-red transition-opacity"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <input
                                        value={value as string}
                                        onChange={(e) => handleUpdateProperty(key, e.target.value)}
                                        className="bg-transparent border-none focus:ring-0 text-sm font-serif outline-none p-0 text-gray-700 dark:text-gray-300"
                                        placeholder="Add a value..."
                                    />
                                </div>
                            ))}
                            {Object.keys(doc.properties).length === 0 && (
                                <div className="col-span-2 py-8 text-center border-2 border-dashed border-black/5 dark:border-white/5 rounded-lg opacity-20 text-xs font-bold uppercase tracking-widest">
                                    No custom properties defined
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
