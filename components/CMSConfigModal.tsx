
import React, { useState } from 'react';
import { X, Save, Globe, Key, Link as LinkIcon, Trash2 } from 'lucide-react';
import { CMSConnection, CMSPlatform } from '../types';

interface CMSConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    connections: CMSConnection[];
    onSaveConnection: (conn: CMSConnection) => void;
    onDeleteConnection: (id: string) => void;
}

export const CMSConfigModal: React.FC<CMSConfigModalProps> = ({ isOpen, onClose, connections, onSaveConnection, onDeleteConnection }) => {
    const [name, setName] = useState('');
    const [platform, setPlatform] = useState<CMSPlatform>(CMSPlatform.WORDPRESS);
    const [url, setUrl] = useState('');
    const [apiKey, setApiKey] = useState('');

    const handleSubmit = () => {
        if (!name) return;
        const newConn: CMSConnection = {
            id: Date.now().toString(),
            name,
            platform,
            url,
            apiKey
        };
        onSaveConnection(newConn);
        // Reset form
        setName('');
        setUrl('');
        setApiKey('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-nb-paper dark:bg-nb-darkPaper border-4 border-black dark:border-white shadow-neo w-full max-w-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-4 border-b-2 border-black dark:border-white bg-nb-blue text-black">
                    <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                        <Globe className="w-5 h-5" /> CMS Connections
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-black/10 rounded-sm transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* List Existing */}
                    <div>
                        <h3 className="font-bold text-sm uppercase mb-3 text-gray-500">Active Connections</h3>
                        {connections.length === 0 ? (
                            <p className="text-sm italic opacity-50">No connections configured.</p>
                        ) : (
                            <div className="grid gap-3">
                                {connections.map(conn => (
                                    <div key={conn.id} className="flex items-center justify-between p-3 border-2 border-black dark:border-white bg-gray-50 dark:bg-gray-800">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 flex items-center justify-center bg-black text-white font-bold text-xs rounded-sm">
                                                {conn.platform[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">{conn.name}</div>
                                                <div className="text-xs opacity-60">{conn.platform} • {conn.url || 'No URL'}</div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => onDeleteConnection(conn.id)}
                                            className="p-2 hover:bg-nb-red hover:text-white transition-colors border-2 border-transparent hover:border-black"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add New */}
                    <div className="p-5 border-2 border-dashed border-black dark:border-white bg-gray-50/50 dark:bg-gray-900/50">
                        <h3 className="font-bold text-sm uppercase mb-4 flex items-center gap-2">
                            <LinkIcon className="w-4 h-4" /> Add New Connection
                        </h3>
                        
                        <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-1">Friendly Name</label>
                                    <input 
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full p-2 border-2 border-black dark:border-white bg-white dark:bg-black focus:shadow-neo-sm outline-none"
                                        placeholder="e.g. My Tech Blog"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-1">Platform</label>
                                    <select 
                                        value={platform}
                                        onChange={e => setPlatform(e.target.value as CMSPlatform)}
                                        className="w-full p-2 border-2 border-black dark:border-white bg-white dark:bg-black focus:shadow-neo-sm outline-none appearance-none"
                                    >
                                        {Object.values(CMSPlatform).map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase mb-1">Site URL</label>
                                <input 
                                    value={url}
                                    onChange={e => setUrl(e.target.value)}
                                    className="w-full p-2 border-2 border-black dark:border-white bg-white dark:bg-black focus:shadow-neo-sm outline-none"
                                    placeholder="https://mysite.com"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase mb-1">API Key / Token</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-2.5 w-4 h-4 opacity-50" />
                                    <input 
                                        type="password"
                                        value={apiKey}
                                        onChange={e => setApiKey(e.target.value)}
                                        className="w-full p-2 pl-9 border-2 border-black dark:border-white bg-white dark:bg-black focus:shadow-neo-sm outline-none"
                                        placeholder="Secret Key"
                                    />
                                </div>
                                <p className="text-[10px] mt-1 opacity-60">Keys are stored locally in your browser.</p>
                            </div>

                            <button 
                                onClick={handleSubmit}
                                disabled={!name}
                                className="mt-2 w-full py-3 bg-black text-white dark:bg-white dark:text-black font-bold uppercase tracking-wider hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-neo"
                            >
                                Add Connection
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
