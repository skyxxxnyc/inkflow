import React, { useState } from 'react';
import { ReadingItem } from '../types';
import { Bookmark, Search, Plus, Archive, Star, CheckCircle2, MoreHorizontal, Sparkles, ExternalLink, Rss, Share2, Trash2, Loader2, ArrowRight, Globe } from 'lucide-react';
import { getArticleInsights, findRelatedArticles, generateSocialShare } from '../services/geminiService';

interface ReadingListViewProps {
    items: ReadingItem[];
    onAddItem: (item: ReadingItem) => void;
    onUpdateItem: (item: ReadingItem) => void;
    onDeleteItem: (id: string) => void;
}

export const ReadingListView: React.FC<ReadingListViewProps> = ({ items, onAddItem, onUpdateItem, onDeleteItem }) => {
    const [view, setView] = useState<'unread' | 'favorites' | 'archive' | 'discover'>('unread');
    const [searchQuery, setSearchQuery] = useState('');
    const [newItemUrl, setNewItemUrl] = useState('');
    
    // Discover State
    const [discoverTopic, setDiscoverTopic] = useState('');
    const [discoverResults, setDiscoverResults] = useState<any[]>([]);
    const [isDiscovering, setIsDiscovering] = useState(false);

    // AI Processing State
    const [processingId, setProcessingId] = useState<string | null>(null);

    const filteredItems = items.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.url.includes(searchQuery.toLowerCase());
        if (view === 'unread') return item.status === 'unread' && matchesSearch;
        if (view === 'favorites') return item.status === 'favorite' && matchesSearch;
        if (view === 'archive') return item.status === 'archived' && matchesSearch;
        return false;
    });

    const handleAddUrl = () => {
        if (!newItemUrl) return;
        try {
            const urlObj = new URL(newItemUrl);
            const newItem: ReadingItem = {
                id: Date.now().toString(),
                url: newItemUrl,
                title: urlObj.hostname + (urlObj.pathname.length > 1 ? urlObj.pathname : ''), // Temporary title
                domain: urlObj.hostname.replace('www.', ''),
                tags: [],
                status: 'unread',
                addedAt: Date.now(),
                sourceType: 'manual'
            };
            onAddItem(newItem);
            setNewItemUrl('');
        } catch (e) {
            alert("Invalid URL");
        }
    };

    const handleGetInsights = async (item: ReadingItem) => {
        setProcessingId(item.id);
        const insights = await getArticleInsights(item.url, item.title);
        onUpdateItem({ ...item, aiSummary: insights });
        setProcessingId(null);
    };

    const handleShare = async (item: ReadingItem) => {
        setProcessingId(item.id);
        const post = await generateSocialShare(item.title, item.aiSummary || "An interesting read.");
        if (navigator.share) {
            navigator.share({ title: item.title, text: post, url: item.url }).catch(() => {});
        } else {
            // Fallback copy
            navigator.clipboard.writeText(post + "\n" + item.url);
            alert("Social post copied to clipboard!");
        }
        setProcessingId(null);
    };

    const handleDiscover = async () => {
        if (!discoverTopic) return;
        setIsDiscovering(true);
        const results = await findRelatedArticles(discoverTopic);
        setDiscoverResults(results);
        setIsDiscovering(false);
    };

    const addDiscoveredItem = (res: any) => {
        onAddItem({
            id: Date.now().toString(),
            url: res.url,
            title: res.title,
            domain: res.domain,
            tags: ['Discovered'],
            status: 'unread',
            addedAt: Date.now(),
            sourceType: 'discovery'
        });
        // Remove from list to show it's added
        setDiscoverResults(prev => prev.filter(r => r.url !== res.url));
    };

    return (
        <div className="flex-1 h-full bg-nb-bg dark:bg-nb-darkBg flex flex-col p-8 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2 text-gray-500 font-bold uppercase text-xs tracking-wider">
                        <Bookmark className="w-4 h-4" /> Reading List
                    </div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">
                        InkFlow Reader
                    </h1>
                    <p className="text-gray-500 font-serif italic">
                        Curate, analyze, and consume content without distractions.
                    </p>
                </div>
                
                {/* Quick Add */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <input 
                            value={newItemUrl}
                            onChange={(e) => setNewItemUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
                            className="pl-4 pr-12 py-3 border-2 border-black dark:border-white w-64 focus:w-80 transition-all shadow-neo-sm focus:outline-none text-sm font-medium"
                            placeholder="Save URL or RSS..."
                        />
                        <button 
                            onClick={handleAddUrl}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-sm"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center border-b-2 border-black dark:border-white mb-6 overflow-x-auto">
                {['unread', 'favorites', 'archive', 'discover'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setView(tab as any)}
                        className={`
                            px-6 py-3 font-bold uppercase text-xs tracking-wider flex items-center gap-2 border-r-2 border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
                            ${view === tab ? (
                                tab === 'unread' ? 'bg-nb-yellow text-black' :
                                tab === 'favorites' ? 'bg-nb-red text-white' :
                                tab === 'discover' ? 'bg-nb-blue text-black' :
                                'bg-black text-white dark:bg-white dark:text-black'
                            ) : ''}
                        `}
                    >
                        {tab === 'unread' && <CheckCircle2 className="w-4 h-4" />}
                        {tab === 'favorites' && <Star className="w-4 h-4" />}
                        {tab === 'archive' && <Archive className="w-4 h-4" />}
                        {tab === 'discover' && <Search className="w-4 h-4" />}
                        {tab}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                
                {view === 'discover' ? (
                    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-nb-blue border-2 border-black dark:border-white shadow-neo p-8 text-center">
                            <h2 className="text-2xl font-black uppercase mb-4">Discover New Content</h2>
                            <p className="font-serif italic mb-6">Use AI to find high-quality articles related to your interests.</p>
                            <div className="flex max-w-lg mx-auto relative">
                                <input 
                                    value={discoverTopic}
                                    onChange={(e) => setDiscoverTopic(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleDiscover()}
                                    className="w-full p-4 border-2 border-black dark:border-white shadow-neo-sm focus:outline-none"
                                    placeholder="e.g. 'Future of React Server Components'..."
                                />
                                <button 
                                    onClick={handleDiscover}
                                    disabled={isDiscovering}
                                    className="absolute right-2 top-2 bottom-2 px-4 bg-black text-white font-bold uppercase hover:bg-gray-800 disabled:opacity-50"
                                >
                                    {isDiscovering ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {discoverResults.map((res, i) => (
                                <div key={i} className="bg-white dark:bg-nb-darkPaper border-2 border-black dark:border-white p-4 flex justify-between items-center shadow-neo-sm">
                                    <div>
                                        <h3 className="font-bold text-lg mb-1">{res.title}</h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 uppercase font-bold">
                                            <Globe className="w-3 h-3" /> {res.domain}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => addDiscoveredItem(res)}
                                        className="px-4 py-2 border-2 border-black dark:border-white hover:bg-nb-green hover:text-white transition-colors font-bold text-xs uppercase flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Save
                                    </button>
                                </div>
                            ))}
                            {discoverResults.length === 0 && !isDiscovering && discoverTopic && (
                                <p className="text-center opacity-50 italic">Try searching for a topic above.</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                         {/* Search Filter for Library */}
                         {items.length > 0 && (
                            <div className="col-span-full mb-4">
                                <input 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-transparent border-b-2 border-gray-300 dark:border-gray-700 py-2 focus:border-black dark:focus:border-white focus:outline-none font-serif text-lg"
                                    placeholder="Filter your library..."
                                />
                            </div>
                         )}

                         {filteredItems.length === 0 ? (
                             <div className="col-span-full text-center py-20 opacity-40">
                                 <Bookmark className="w-16 h-16 mx-auto mb-4" />
                                 <p className="font-bold uppercase text-lg">No articles found.</p>
                             </div>
                         ) : (
                             filteredItems.map(item => (
                                 <div key={item.id} className="bg-white dark:bg-nb-darkPaper border-2 border-black dark:border-white shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo transition-all flex flex-col h-[320px] relative group">
                                     {/* Card Header */}
                                     <div className="p-4 border-b-2 border-black dark:border-white flex justify-between items-start bg-gray-50 dark:bg-gray-800">
                                         <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                            {item.sourceType === 'rss' && <Rss className="w-3 h-3" />}
                                            {item.sourceType === 'discovery' && <Search className="w-3 h-3" />}
                                            {item.domain}
                                         </div>
                                         <div className="flex gap-1">
                                             <button 
                                                onClick={() => onUpdateItem({...item, status: item.status === 'favorite' ? 'unread' : 'favorite'})}
                                                className={`p-1 hover:scale-110 transition-transform ${item.status === 'favorite' ? 'text-nb-yellow fill-current' : 'text-gray-300 hover:text-nb-yellow'}`}
                                            >
                                                <Star className="w-4 h-4" />
                                             </button>
                                             <button 
                                                onClick={() => onUpdateItem({...item, status: item.status === 'archived' ? 'unread' : 'archived'})}
                                                className={`p-1 hover:scale-110 transition-transform ${item.status === 'archived' ? 'text-nb-green' : 'text-gray-300 hover:text-nb-green'}`}
                                            >
                                                <Archive className="w-4 h-4" />
                                             </button>
                                              <button 
                                                onClick={() => onDeleteItem(item.id)}
                                                className="p-1 hover:text-nb-red text-gray-300 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                             </button>
                                         </div>
                                     </div>

                                     {/* Card Body */}
                                     <div className="p-4 flex-1 overflow-y-auto">
                                         <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-3">
                                             <a href={item.url} target="_blank" rel="noreferrer" className="hover:underline decoration-2 underline-offset-2">
                                                 {item.title}
                                             </a>
                                         </h3>
                                         
                                         {item.aiSummary ? (
                                             <div className="mt-3 p-3 bg-nb-yellow/10 border-l-4 border-nb-yellow text-xs font-serif leading-relaxed">
                                                 <p className="font-bold uppercase text-[10px] mb-1 text-nb-yellow/80 flex items-center gap-1">
                                                     <Sparkles className="w-3 h-3" /> AI Insight
                                                 </p>
                                                 <div className="prose prose-sm dark:prose-invert">
                                                    {item.aiSummary}
                                                 </div>
                                             </div>
                                         ) : (
                                             <button 
                                                onClick={() => handleGetInsights(item)}
                                                disabled={processingId === item.id}
                                                className="mt-4 text-xs font-bold uppercase text-nb-purple flex items-center gap-1 hover:underline disabled:opacity-50"
                                             >
                                                 {processingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                 Generate Insights
                                             </button>
                                         )}
                                     </div>

                                     {/* Card Footer */}
                                     <div className="p-3 border-t-2 border-black dark:border-white flex gap-2">
                                         <a 
                                            href={item.url} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="flex-1 py-2 bg-black text-white dark:bg-white dark:text-black font-bold text-xs uppercase flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
                                        >
                                            <ExternalLink className="w-3 h-3" /> Read
                                         </a>
                                         <button 
                                            onClick={() => handleShare(item)}
                                            className="px-3 border-2 border-black dark:border-white hover:bg-nb-blue hover:text-black transition-colors"
                                            title="Share with AI Caption"
                                        >
                                             {processingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                                         </button>
                                     </div>
                                 </div>
                             ))
                         )}
                    </div>
                )}
            </div>
        </div>
    );
};