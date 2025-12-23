
import React, { useState, useRef, useEffect } from 'react';
import { DraftingSidebar } from './components/DraftingSidebar';
import { FloatingMenu } from './components/FloatingMenu';
import { ProactiveAgent } from './components/ProactiveAgent';
import { SettingsModal } from './components/SettingsModal';
import { NavigationSidebar } from './components/NavigationSidebar';
import { LibraryView } from './components/LibraryView';
import { ReadingListView } from './components/ReadingListView';
import { CMSConfigModal } from './components/CMSConfigModal';
import { TemplateModal, Template } from './components/TemplateModal';
import { LoginScreen } from './components/LoginScreen';
import { DocumentHeader } from './components/DocumentHeader';
import { PromptLibraryView } from './components/PromptLibraryView';
import { Moon, Sun, Plus, PenTool, Layout, FileText, CheckCircle2, Settings, Columns, Eye, Mic, MicOff, Loader2, Check, Download, AlignLeft, FileDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Tooltip } from './components/Tooltip';
import { getCompletion } from './services/geminiService';
import { api } from './services/api';
import { PromptSettings, DEFAULT_PROMPT_SETTINGS, Article, Document, DocumentStatus, CMSConnection, Database, User, AppMode, ReadingItem, AIPrompt } from './types';
import { parse } from 'marked';
import { jsPDF } from 'jspdf';

// Helper to generate keys based on user ID
const getStorageKey = (key: string, userId: string) => `inkflow_${key}_${userId}`;

function App() {
    const [darkMode, setDarkMode] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false); // Right sidebar
    const [navOpen, setNavOpen] = useState(true); // Left sidebar
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const [cmsModalOpen, setCmsModalOpen] = useState(false);
    const [templateModalOpen, setTemplateModalOpen] = useState(false);

    // --- AUTH STATE ---
    const [user, setUser] = useState<User | null>(() => {
        const savedUser = localStorage.getItem('inkflow_user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    // --- DATA STATE (Initialized Empty, populated by Effect) ---
    const [databases, setDatabases] = useState<Database[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [cmsConnections, setCmsConnections] = useState<CMSConnection[]>([]);
    const [prompts, setPrompts] = useState<AIPrompt[]>([]);

    // Legacy support map: Mapping old Article[] to new ReadingItem[] if needed, 
    // but for simplicity we will maintain a separate readingList state.
    // We keep savedArticles for the DraftingSidebar compatibility but sync logically if we wanted to.
    // For this implementation, readingList is the source of truth for the Pocket clone.
    const [readingList, setReadingList] = useState<ReadingItem[]>([]);
    const [savedArticles, setSavedArticles] = useState<Article[]>([]); // Kept for legacy components

    const [promptSettings, setPromptSettings] = useState<PromptSettings>(DEFAULT_PROMPT_SETTINGS);

    // View Context
    const [appMode, setAppMode] = useState<AppMode>(AppMode.WRITE);
    const [currentDatabaseId, setCurrentDatabaseId] = useState<string | null>(null);
    const [currentDocId, setCurrentDocId] = useState<string | null>(null);

    // Local edit content state (synced to currentDocId on save/switch)
    const [content, setContent] = useState('');

    // Editor UI State
    const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
    const [selectedText, setSelectedText] = useState('');
    const [ghostText, setGhostText] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
    const [isListening, setIsListening] = useState(false);

    const [lastSuggestion, setLastSuggestion] = useState<{ original: string, replacement: string } | null>(null);

    const editorRef = useRef<HTMLTextAreaElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const recognitionRef = useRef<any>(null);

    // --- EFFECTS ---

    // Dark Mode
    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [darkMode]);

    // --- LOAD USER DATA ---
    useEffect(() => {
        const loadData = async () => {
            if (user) {
                const userId = user.id;

                try {
                    // Fetch from API
                    const [dbList, docList, readingItems, promptList, cmsList, settings] = await Promise.all([
                        api.getDatabases(userId),
                        api.getDocuments(userId),
                        api.getReadingItems(userId),
                        api.getPrompts(userId),
                        api.getCMSConnections(userId),
                        api.getSettings(userId)
                    ]);

                    setDatabases(dbList);
                    setDocuments(docList);
                    setReadingList(readingItems);
                    setPrompts(promptList);
                    setCmsConnections(cmsList);
                    if (Object.keys(settings).length > 0) {
                        setPromptSettings(settings);
                        if (settings.savedArticles) setSavedArticles(settings.savedArticles);
                    }

                } catch (err) {
                    console.error("Failed to load data from API", err);
                }
            } else {
                // Clear state on logout
                setDatabases([]);
                setDocuments([]);
                setCmsConnections([]);
                setSavedArticles([]);
                setReadingList([]);
                setPromptSettings(DEFAULT_PROMPT_SETTINGS);
                setCurrentDocId(null);
                setCurrentDatabaseId(null);
                setAppMode(AppMode.WRITE);
            }
        };

        loadData();
    }, [user]);

    // --- PERSIST USER DATA ---
    // savedArticles and promptSettings are now handled via updatePromptSettings and handleSaveArticle


    // Save Prompt Settings to API when they change
    const updatePromptSettings = async (newSettings: PromptSettings) => {
        if (!user) return;
        setPromptSettings(newSettings);
        try {
            await api.updateSettings(user.id, { ...newSettings, savedArticles });
        } catch (err) {
            console.error("Failed to save settings to API", err);
        }
    };


    // Load Content when Doc Switches
    useEffect(() => {
        if (currentDocId) {
            const doc = documents.find(d => d.id === currentDocId);
            if (doc) setContent(doc.content);
            setAppMode(AppMode.WRITE); // Switch back to write mode when selecting doc
        } else {
            setContent(''); // Library view
        }
    }, [currentDocId, documents]);

    // Auto-Save Content to API
    useEffect(() => {
        if (!currentDocId || !user) return;

        setSaveStatus('saving');
        const timeoutId = setTimeout(async () => {
            const doc = documents.find(d => d.id === currentDocId);
            if (!doc) return;

            let title = doc.title;
            if (title === 'Untitled Page' || title === 'Untitled Draft') {
                const firstLine = content.split('\n')[0].substring(0, 30);
                if (firstLine.trim().length > 0) title = firstLine;
            }

            try {
                const updatedDoc = await api.updateDocument(user.id, currentDocId, {
                    content,
                    title,
                    status: doc.status,
                    databaseId: doc.databaseId
                });

                setDocuments(prevDocs => prevDocs.map(d => d.id === currentDocId ? {
                    ...updatedDoc,
                    createdAt: new Date(updatedDoc.createdAt).getTime(),
                    updatedAt: new Date(updatedDoc.updatedAt).getTime()
                } : d));
                setSaveStatus('saved');
            } catch (err) {
                console.error("Auto-save failed", err);
            }
        }, 1500);

        return () => clearTimeout(timeoutId);
    }, [content, currentDocId, user]);


    // Voice Recognition Setup
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
                }
                if (finalTranscript) insertTextAtCursor(finalTranscript + ' ');
            };

            recognitionRef.current.onerror = () => setIsListening(false);
            recognitionRef.current.onend = () => {
                if (isListening) try { recognitionRef.current.start(); } catch (e) { setIsListening(false); }
            };
        }
    }, [isListening]);

    // --- ACTIONS ---

    const handleLogin = (newUser: User) => {
        setUser(newUser);
        localStorage.setItem('inkflow_user', JSON.stringify(newUser));
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('inkflow_user');
        setCurrentDocId(null);
    };

    const handleUpdateDoc = async (id: string, updates: Partial<Document>) => {
        if (!user) return;

        // Optimistic update
        setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));

        try {
            const updated = await api.updateDocument(user.id, id, updates);
            setDocuments(prev => prev.map(d => d.id === id ? {
                ...updated,
                createdAt: new Date(updated.createdAt).getTime(),
                updatedAt: new Date(updated.updatedAt).getTime()
            } : d));
        } catch (err) {
            console.error("Failed to update document metadata", err);
        }
    };

    const handleCreateDatabase = async (name: string) => {
        if (!user) return;
        try {
            const newDb = await api.createDatabase(user.id, name);
            setDatabases(prev => [...prev, newDb]);
            setCurrentDatabaseId(newDb.id);
            setCurrentDocId(null);
            setAppMode(AppMode.WRITE);
        } catch (err) {
            console.error("Failed to create database", err);
        }
    };

    const handleDeleteDatabase = async (id: string) => {
        if (!user) return;
        if (confirm('Delete this database? Documents will remain in "All Documents".')) {
            try {
                await api.deleteDatabase(user.id, id);
                setDatabases(prev => prev.filter(db => db.id !== id));
                // Sync documents locally (the backend already unlinked them)
                setDocuments(prev => prev.map(doc => doc.databaseId === id ? { ...doc, databaseId: undefined } : doc));
                if (currentDatabaseId === id) setCurrentDatabaseId(null);
            } catch (err) {
                console.error("Failed to delete database", err);
            }
        }
    };

    const handleCreateDoc = async (targetDatabaseId?: string, template?: Template, parentId?: string) => {
        if (!user) return;
        try {
            const newDoc = await api.createDocument(user.id, {
                title: template ? template.defaultTitle : 'Untitled Page',
                content: template ? template.content : '',
                status: DocumentStatus.DRAFT,
                databaseId: targetDatabaseId,
                parentId: parentId,
                tags: []
            });

            setDocuments(prev => [newDoc, ...prev]);
            setCurrentDocId(newDoc.id);
            setAppMode(AppMode.WRITE);
            setTemplateModalOpen(false);
        } catch (err) {
            console.error("Failed to create document", err);
        }
    };

    const handleDeleteDoc = async (id: string) => {
        if (!user) return;
        if (confirm('Are you sure you want to delete this document?')) {
            try {
                await api.deleteDocument(user.id, id);
                setDocuments(prev => prev.filter(d => d.id !== id));
                if (currentDocId === id) setCurrentDocId(null);
            } catch (err) {
                console.error("Failed to delete document", err);
            }
        }
    };

    const handleUpdateDatabaseView = async (id: string, viewType: 'TABLE' | 'GALLERY' | 'LIST') => {
        if (!user) return;
        try {
            const updated = await api.updateDatabase(user.id, id, { viewType });
            setDatabases(prev => prev.map(db => db.id === id ? updated : db));
        } catch (err) {
            console.error("Failed to update database view", err);
        }
    };

    const handleAddPrompt = async (prompt: Partial<AIPrompt>) => {
        if (!user) return;
        try {
            const newPrompt = await api.createPrompt(user.id, prompt);
            setPrompts(prev => [newPrompt, ...prev]);
        } catch (err) {
            console.error("Failed to add prompt", err);
        }
    };

    const handleUpdatePrompt = async (id: string, prompt: Partial<AIPrompt>) => {
        if (!user) return;
        try {
            const updated = await api.updatePrompt(user.id, id, prompt);
            setPrompts(prev => prev.map(p => p.id === id ? updated : p));
        } catch (err) {
            console.error("Failed to update prompt", err);
        }
    };

    const handleDeletePrompt = async (id: string) => {
        if (!user) return;
        if (confirm('Delete this prompt from library?')) {
            try {
                await api.deletePrompt(user.id, id);
                setPrompts(prev => prev.filter(p => p.id !== id));
            } catch (err) {
                console.error("Failed to delete prompt", err);
            }
        }
    };

    const handleImportPrompts = async (imported: Partial<AIPrompt>[]) => {
        if (!user) return;
        try {
            await api.importPrompts(user.id, imported);
            const freshPrompts = await api.getPrompts(user.id);
            setPrompts(freshPrompts);
        } catch (err) {
            console.error("Failed to import prompts", err);
        }
    };

    const handleSaveCMSConnection = async (conn: CMSConnection) => {
        if (!user) return;
        try {
            const newConn = await api.createCMSConnection(user.id, conn);
            setCmsConnections(prev => [...prev, newConn]);
        } catch (err) {
            console.error("Failed to save CMS connection", err);
        }
    };

    const handleDeleteCMSConnection = async (id: string) => {
        if (!user) return;
        try {
            await api.deleteCMSConnection(user.id, id);
            setCmsConnections(prev => prev.filter(c => c.id !== id));
            // Sync documents locally
            setDocuments(prev => prev.map(d => d.cmsConnectionId === id ? { ...d, cmsConnectionId: undefined } : d));
        } catch (err) {
            console.error("Failed to delete CMS connection", err);
        }
    };

    const handleSetDocCMS = async (cmsId: string) => {
        if (currentDocId && user) {
            try {
                const updated = await api.updateDocument(user.id, currentDocId, { cmsConnectionId: cmsId });
                setDocuments(prev => prev.map(d => d.id === currentDocId ? {
                    ...updated,
                    createdAt: new Date(updated.createdAt).getTime(),
                    updatedAt: new Date(updated.updatedAt).getTime()
                } : d));
            } catch (err) {
                console.error("Failed to set document CMS", err);
            }
        }
    };

    const insertTextAtCursor = (text: string) => {
        if (!editorRef.current) return;
        const start = editorRef.current.selectionStart;
        const end = editorRef.current.selectionEnd;
        const newContent = content.substring(0, start) + text + content.substring(end);
        setContent(newContent);
        setTimeout(() => {
            if (editorRef.current) {
                const newPos = start + text.length;
                editorRef.current.setSelectionRange(newPos, newPos);
            }
        }, 0);
    };

    const handleExport = (format: 'md' | 'txt' | 'pdf') => {
        if (!currentDocId) return;
        const filename = `inkflow-${new Date().toISOString().split('T')[0]}`;
        if (format === 'md' || format === 'txt') {
            const mime = format === 'md' ? 'text/markdown' : 'text/plain';
            const blob = new Blob([content], { type: mime });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.${format}`;
            a.click();
        } else if (format === 'pdf') {
            const doc = new jsPDF();
            doc.text(content, 10, 10);
            doc.save(`${filename}.pdf`);
        }
        setExportMenuOpen(false);
    };

    // Editor Handlers
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        setContent(newText);
        setGhostText('');

        if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
        if (e.target.selectionStart === newText.length && newText.length > 20) {
            completionTimerRef.current = setTimeout(async () => {
                const completion = await getCompletion(newText);
                if (completion && editorRef.current?.value === newText) setGhostText(completion);
            }, 1000);
        }
    };

    const handleSelect = () => {
        if (!editorRef.current) return;
        const start = editorRef.current.selectionStart;
        const end = editorRef.current.selectionEnd;
        if (start !== end) setSelectedText(content.substring(start, end));
        else { setSelectionRect(null); setSelectedText(''); }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        const start = editorRef.current?.selectionStart || 0;
        const end = editorRef.current?.selectionEnd || 0;
        if (start !== end) {
            setSelectionRect({ top: e.clientY, left: e.clientX, width: 0, height: 0, right: e.clientX, bottom: e.clientY, x: e.clientX, y: e.clientY, toJSON: () => { } });
        } else setSelectionRect(null);
    };

    const handleReplacement = (newText: string) => {
        if (!editorRef.current) return;
        const start = editorRef.current.selectionStart;
        const end = editorRef.current.selectionEnd;
        const newContent = content.substring(0, start) + newText + content.substring(end);
        setContent(newContent);
        setSelectionRect(null);
    };

    const toggleListening = () => {
        if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
        else { try { recognitionRef.current?.start(); setIsListening(true); } catch (e) { } }
    };

    const handleSaveArticle = async (article: Article) => {
        if (!user) return;

        let newSaved;
        if (savedArticles.some(a => a.uri === article.uri)) {
            newSaved = savedArticles.filter(a => a.uri !== article.uri);
        } else {
            newSaved = [...savedArticles, article];
        }

        setSavedArticles(newSaved);

        try {
            // Update settings (shared storage)
            await api.updateSettings(user.id, { ...promptSettings, savedArticles: newSaved });

            // If adding (not removing), also add to reading list
            if (!savedArticles.some(a => a.uri === article.uri)) {
                const newItem = await api.addReadingItem(user.id, {
                    url: article.uri,
                    title: article.title,
                    domain: article.domain,
                    tags: [],
                    status: 'unread',
                    sourceType: 'manual'
                });
                setReadingList(prev => [newItem, ...prev]);
            }
        } catch (err) {
            console.error("Failed to sync article to backend", err);
        }
    };

    // --- RENDER ---
    if (!user) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    const currentDoc = documents.find(d => d.id === currentDocId);
    const activeDatabase = databases.find(db => db.id === currentDatabaseId);

    return (
        <div className={`h-screen flex transition-colors duration-300 overflow-hidden ${darkMode ? 'dark' : ''}`}>

            {/* --- LEFT NAVIGATION --- */}
            {navOpen && (
                <NavigationSidebar
                    documents={documents}
                    databases={databases}
                    currentDocId={currentDocId}
                    currentDatabaseId={currentDatabaseId}
                    user={user}
                    onSelectDoc={setCurrentDocId}
                    onSelectDatabase={(id) => { setCurrentDatabaseId(id); setCurrentDocId(null); setAppMode(AppMode.WRITE); }}
                    onCreateDoc={() => handleCreateDoc(currentDatabaseId || undefined)}
                    onCreateDatabase={handleCreateDatabase}
                    onDeleteDatabase={handleDeleteDatabase}
                    onGoToLibrary={() => { setCurrentDatabaseId(null); setCurrentDocId(null); setAppMode(AppMode.WRITE); }}
                    onGoToReader={() => { setAppMode(AppMode.READ); setCurrentDocId(null); }}
                    onGoToPrompts={() => { setAppMode(AppMode.PROMPTS); setCurrentDocId(null); }}
                    cmsConnections={cmsConnections}
                    onOpenCMSSettings={() => setCmsModalOpen(true)}
                    onLogout={handleLogout}
                    currentMode={appMode}
                    onCreateSubPage={(parentId) => {
                        const parent = documents.find(d => d.id === parentId);
                        handleCreateDoc(parent?.databaseId || undefined, undefined, parentId);
                    }}
                />
            )}

            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex-1 flex flex-col h-full bg-nb-bg dark:bg-nb-darkBg min-w-0">

                {/* --- HEADER --- */}
                {appMode === AppMode.WRITE && (
                    <header className="h-16 bg-nb-paper dark:bg-nb-darkPaper border-b-2 border-black dark:border-white flex items-center justify-between px-6 shrink-0 z-30">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setNavOpen(!navOpen)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm">
                                {navOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
                            </button>
                            {currentDoc ? (
                                <div className="flex items-center gap-2">
                                    <h1 className="text-sm font-bold truncate max-w-[200px]">{currentDoc.title || "Untitled"}</h1>
                                    <span className="text-[10px] uppercase bg-gray-200 px-1.5 py-0.5 rounded-sm">{currentDoc.status}</span>
                                </div>
                            ) : (
                                <h1 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                                    {activeDatabase ? activeDatabase.name : 'Dashboard'}
                                </h1>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            {currentDocId && (
                                <>
                                    <div className="hidden md:flex items-center gap-4 text-xs font-mono font-bold text-gray-500 border-r-2 border-gray-200 pr-4 mr-2">
                                        <span className="flex items-center gap-1">
                                            {saveStatus === 'saving' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                            {saveStatus}
                                        </span>
                                        <span>{content.trim() === '' ? 0 : content.trim().split(/\s+/).length} w</span>
                                    </div>

                                    <Tooltip content={isListening ? "Stop Voice" : "Start Voice"}>
                                        <button onClick={toggleListening} className={`p-2 border-2 border-black dark:border-white rounded-full ${isListening ? 'bg-nb-red text-white animate-pulse' : 'hover:bg-gray-100'}`}>
                                            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                        </button>
                                    </Tooltip>

                                    <div className="relative">
                                        <Tooltip content="Export">
                                            <button onClick={() => setExportMenuOpen(!exportMenuOpen)} className="p-2 border-2 border-black dark:border-white hover:bg-gray-100">
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </Tooltip>
                                        {exportMenuOpen && (
                                            <div className="absolute top-full right-0 mt-2 w-48 bg-nb-paper border-2 border-black shadow-neo z-50 flex flex-col py-2">
                                                <button onClick={() => handleExport('md')} className="px-4 py-2 hover:bg-nb-yellow text-left text-sm font-bold uppercase flex gap-2">
                                                    <FileText className="w-4 h-4" /> Markdown
                                                </button>
                                                <button onClick={() => handleExport('txt')} className="px-4 py-2 hover:bg-nb-blue text-left text-sm font-bold uppercase flex gap-2">
                                                    <AlignLeft className="w-4 h-4" /> Plain Text
                                                </button>
                                                <button onClick={() => handleExport('pdf')} className="px-4 py-2 hover:bg-nb-red text-left text-sm font-bold uppercase flex gap-2">
                                                    <FileDown className="w-4 h-4" /> PDF
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <Tooltip content="Drafting Tools">
                                        <button onClick={() => setSidebarOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-nb-yellow border-2 border-black shadow-neo hover:translate-x-[1px] hover:translate-y-[1px] text-sm font-bold">
                                            <Plus className="w-4 h-4" /> Tools
                                        </button>
                                    </Tooltip>

                                    <div className="w-px h-6 bg-gray-300 mx-1"></div>

                                    <button onClick={() => setShowPreview(!showPreview)} className={`p-2 border-2 border-black dark:border-white ${showPreview ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
                                        <Columns className="w-4 h-4" />
                                    </button>
                                </>
                            )}

                            <button onClick={() => setSettingsOpen(true)} className="p-2 hover:bg-gray-100 rounded-sm">
                                <Settings className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-gray-100 rounded-sm">
                                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>
                        </div>
                    </header>
                )}

                {/* --- CONTENT --- */}
                <main className="flex-1 overflow-hidden relative">
                    {appMode === AppMode.READ ? (
                        <ReadingListView
                            items={readingList}
                            onAddItem={(item) => setReadingList(prev => [item, ...prev])}
                            onUpdateItem={async (updated) => {
                                if (!user) return;
                                try {
                                    const fresh = await api.updateReadingItem(user.id, updated.id, updated);
                                    setReadingList(prev => prev.map(i => i.id === fresh.id ? {
                                        ...fresh,
                                        tags: typeof fresh.tags === 'string' ? JSON.parse(fresh.tags) : fresh.tags,
                                        addedAt: new Date(fresh.addedAt).getTime()
                                    } : i));
                                } catch (err) {
                                    console.error("Failed to update reading item", err);
                                }
                            }}
                            onDeleteItem={async (id) => {
                                if (!user) return;
                                try {
                                    await api.deleteReadingItem(user.id, id);
                                    setReadingList(prev => prev.filter(i => i.id !== id));
                                } catch (err) {
                                    console.error("Failed to delete reading item", err);
                                }
                            }}
                        />
                    ) : appMode === AppMode.PROMPTS ? (
                        <PromptLibraryView
                            prompts={prompts}
                            user={user}
                            onAddPrompt={handleAddPrompt}
                            onUpdatePrompt={handleUpdatePrompt}
                            onDeletePrompt={handleDeletePrompt}
                            onDeletePrompts={async (ids) => {
                                if (!user) return;
                                if (confirm(`Delete ${ids.length} prompts from library?`)) {
                                    try {
                                        await api.deletePromptsBatch(user.id, ids);
                                        setPrompts(prev => prev.filter(p => !ids.includes(p.id)));
                                    } catch (err) {
                                        console.error("Failed to delete prompts", err);
                                    }
                                }
                            }}
                            onImportPrompts={handleImportPrompts}
                        />
                    ) : (
                        currentDocId ? (
                            // EDITOR VIEW
                            <div className="h-full flex justify-center overflow-y-auto">
                                <div className={`relative h-full transition-all duration-300 w-full flex gap-6 p-4 ${showPreview ? 'max-w-[95%]' : 'max-w-5xl'}`}>
                                    {/* Editor Column */}
                                    <div className={`relative h-full flex-1 flex flex-col ${showPreview ? 'hidden lg:flex' : ''}`}>
                                        <DocumentHeader
                                            doc={currentDoc!}
                                            cmsConnections={cmsConnections}
                                            onUpdateDoc={handleUpdateDoc}
                                        />
                                        <div className="flex-1 relative min-h-[500px]">
                                            {/* Ghost Text */}
                                            <div
                                                ref={overlayRef}
                                                className="absolute top-0 left-0 w-full h-full text-lg md:text-xl font-serif leading-relaxed text-transparent p-8 whitespace-pre-wrap break-words pointer-events-none z-0"
                                            >
                                                <span className="text-transparent">{content}</span>
                                                <span className="text-gray-400 opacity-60 font-serif">{ghostText}</span>
                                            </div>

                                            <textarea
                                                ref={editorRef}
                                                value={content}
                                                onChange={handleChange}
                                                onSelect={handleSelect}
                                                onMouseUp={handleMouseUp}
                                                onScroll={(e) => overlayRef.current && (overlayRef.current.scrollTop = e.currentTarget.scrollTop)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Tab' && ghostText) {
                                                        e.preventDefault();
                                                        const newContent = content + ghostText;
                                                        setContent(newContent);
                                                        setGhostText('');
                                                        setTimeout(() => { if (editorRef.current) editorRef.current.selectionStart = editorRef.current.selectionEnd = newContent.length; }, 0);
                                                    }
                                                }}
                                                placeholder="Start writing..."
                                                className="w-full h-full bg-transparent border-none focus:ring-0 text-lg md:text-xl font-serif leading-relaxed text-gray-800 dark:text-gray-200 resize-none outline-none p-8 relative z-10"
                                            />
                                        </div>
                                    </div>

                                    {/* Preview Column */}
                                    {showPreview && (
                                        <div className="flex-1 h-full overflow-y-auto p-8 border-2 border-black dark:border-white bg-nb-paper dark:bg-nb-darkPaper shadow-neo animate-in fade-in slide-in-from-right-4">
                                            <div className="flex items-center gap-2 mb-6 opacity-50 border-b border-black pb-2">
                                                <Eye className="w-4 h-4" /> <span className="text-xs font-bold uppercase">Preview</span>
                                            </div>
                                            <div className="markdown-preview font-serif text-lg text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: parse(content || '') as string }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // LIBRARY VIEW
                            <LibraryView
                                documents={documents}
                                databases={databases}
                                currentDatabaseId={currentDatabaseId}
                                cmsConnections={cmsConnections}
                                onOpenDoc={(id) => { setCurrentDocId(id); setAppMode(AppMode.WRITE); }}
                                onDeleteDoc={handleDeleteDoc}
                                onCreateDoc={() => handleCreateDoc(currentDatabaseId || undefined)}
                                onOpenTemplates={() => setTemplateModalOpen(true)}
                                onUpdateDatabaseView={handleUpdateDatabaseView}
                            />
                        )
                    )}
                </main>
            </div>

            {/* --- MODALS & OVERLAYS --- */}
            <TemplateModal
                isOpen={templateModalOpen}
                onClose={() => setTemplateModalOpen(false)}
                onSelectTemplate={(t) => handleCreateDoc(currentDatabaseId || undefined, t)}
            />

            <DraftingSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onDraftInsert={insertTextAtCursor}
                savedArticles={savedArticles}
                onRemoveArticle={async (uri) => {
                    const newSaved = savedArticles.filter(a => a.uri !== uri);
                    setSavedArticles(newSaved);
                    if (user) {
                        try {
                            await api.updateSettings(user.id, { ...promptSettings, savedArticles: newSaved });
                        } catch (err) {
                            console.error("Failed to remove article from backend settings", err);
                        }
                    }
                }}
                cmsConnections={cmsConnections}
                onSetDocCMS={handleSetDocCMS}
                currentDocContent={content}
            />

            <FloatingMenu
                selectionRect={selectionRect}
                selectedText={selectedText}
                fullText={content}
                settings={promptSettings}
                onClose={() => setSelectionRect(null)}
                onReplace={handleReplacement}
            />

            {currentDocId && (
                <ProactiveAgent
                    currentText={content}
                    onApplySuggestion={(o, r) => {
                        const idx = content.lastIndexOf(o);
                        if (idx !== -1) {
                            setContent(content.substring(0, idx) + r + content.substring(idx + o.length));
                            setLastSuggestion({ original: o, replacement: r });
                        }
                    }}
                    canUndo={!!lastSuggestion}
                    onUndo={() => {
                        if (lastSuggestion) {
                            const idx = content.lastIndexOf(lastSuggestion.replacement);
                            if (idx !== -1) {
                                setContent(content.substring(0, idx) + lastSuggestion.original + content.substring(idx + lastSuggestion.replacement.length));
                                setLastSuggestion(null);
                            }
                        }
                    }}
                    savedArticles={savedArticles}
                    onSaveArticle={handleSaveArticle}
                />
            )}

            <SettingsModal
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                settings={promptSettings}
                onSave={updatePromptSettings}
            />

            <CMSConfigModal
                isOpen={cmsModalOpen}
                onClose={() => setCmsModalOpen(false)}
                connections={cmsConnections}
                onSaveConnection={handleSaveCMSConnection}
                onDeleteConnection={handleDeleteCMSConnection}
            />
        </div>
    );
}

export default App;
