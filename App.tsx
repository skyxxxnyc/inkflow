
import React, { useState, useRef, useEffect } from 'react';
import { DraftingSidebar } from './components/DraftingSidebar';
import { FloatingMenu } from './components/FloatingMenu';
import { ProactiveAgent } from './components/ProactiveAgent';
import { SettingsModal } from './components/SettingsModal';
import { NavigationSidebar } from './components/NavigationSidebar';
import { LibraryView } from './components/LibraryView';
import { CMSConfigModal } from './components/CMSConfigModal';
import { LoginScreen } from './components/LoginScreen';
import { Moon, Sun, Plus, PenTool, Layout, FileText, CheckCircle2, Settings, Columns, Eye, Mic, MicOff, Loader2, Check, Download, AlignLeft, FileDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Tooltip } from './components/Tooltip';
import { getCompletion } from './services/geminiService';
import { PromptSettings, DEFAULT_PROMPT_SETTINGS, Article, Document, DocumentStatus, CMSConnection, Database, User } from './types';
import { parse } from 'marked';
import { jsPDF } from 'jspdf';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Right sidebar
  const [navOpen, setNavOpen] = useState(true); // Left sidebar
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [cmsModalOpen, setCmsModalOpen] = useState(false);
  
  // --- AUTH STATE ---
  const [user, setUser] = useState<User | null>(() => {
      const savedUser = localStorage.getItem('inkflow_user');
      return savedUser ? JSON.parse(savedUser) : null;
  });

  // --- DATABASE STATE ---
  const [databases, setDatabases] = useState<Database[]>(() => {
      const saved = localStorage.getItem('inkflow_databases');
      return saved ? JSON.parse(saved) : [];
  });
  
  // View Context: If currentDocId is null, we are in Library. 
  // If currentDatabaseId is set, we filter Library by that DB.
  const [currentDatabaseId, setCurrentDatabaseId] = useState<string | null>(null);

  // --- DOCUMENT MANAGEMENT STATE ---
  const [documents, setDocuments] = useState<Document[]>(() => {
      const savedDocs = localStorage.getItem('inkflow_documents');
      if (savedDocs) return JSON.parse(savedDocs);
      
      // Migration from old single-doc version
      const oldContent = localStorage.getItem('inkflow_content');
      if (oldContent) {
          const newDoc: Document = {
              id: 'migrated-doc',
              title: 'Untitled Draft',
              content: oldContent,
              status: DocumentStatus.DRAFT,
              tags: [],
              createdAt: Date.now(),
              updatedAt: Date.now()
          };
          return [newDoc];
      }
      return [];
  });

  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  
  // Local edit content state (synced to currentDocId on save/switch)
  const [content, setContent] = useState('');
  
  // CMS Connections State
  const [cmsConnections, setCmsConnections] = useState<CMSConnection[]>(() => {
      const saved = localStorage.getItem('inkflow_cms_connections');
      return saved ? JSON.parse(saved) : [];
  });

  // Editor UI State
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [ghostText, setGhostText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [isListening, setIsListening] = useState(false);

  // Settings & Undo
  const [promptSettings, setPromptSettings] = useState<PromptSettings>(() => {
      const saved = localStorage.getItem('inkflow_prompt_settings');
      return saved ? JSON.parse(saved) : DEFAULT_PROMPT_SETTINGS;
  });
  const [savedArticles, setSavedArticles] = useState<Article[]>(() => {
      const saved = localStorage.getItem('inkflow_saved_articles');
      return saved ? JSON.parse(saved) : [];
  });
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

  // Load Content when Doc Switches
  useEffect(() => {
    if (currentDocId) {
        const doc = documents.find(d => d.id === currentDocId);
        if (doc) setContent(doc.content);
    } else {
        setContent(''); // Library view
    }
  }, [currentDocId]);

  // Auto-Save Content to Documents Array & Persistence
  useEffect(() => {
    if (!currentDocId) return;
    
    setSaveStatus('saving');
    const timeoutId = setTimeout(() => {
        setDocuments(prevDocs => {
            const newDocs = prevDocs.map(doc => {
                if (doc.id === currentDocId) {
                    // Try to infer a title from the first line if it's untitled
                    let title = doc.title;
                    if (title === 'Untitled Page' || title === 'Untitled Draft') {
                        const firstLine = content.split('\n')[0].substring(0, 30);
                        if (firstLine.trim().length > 0) title = firstLine;
                    }

                    return { 
                        ...doc, 
                        content, 
                        title,
                        updatedAt: Date.now() 
                    };
                }
                return doc;
            });
            // Persist entire array
            localStorage.setItem('inkflow_documents', JSON.stringify(newDocs));
            return newDocs;
        });
        setSaveStatus('saved');
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [content, currentDocId]);

  // Persist CMS connections
  useEffect(() => {
      localStorage.setItem('inkflow_cms_connections', JSON.stringify(cmsConnections));
  }, [cmsConnections]);

  // Persist Databases
  useEffect(() => {
      localStorage.setItem('inkflow_databases', JSON.stringify(databases));
  }, [databases]);


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

  const handleCreateDatabase = (name: string) => {
      const newDb: Database = {
          id: Date.now().toString(),
          name,
          createdAt: Date.now()
      };
      setDatabases(prev => [...prev, newDb]);
      setCurrentDatabaseId(newDb.id);
      setCurrentDocId(null);
  };

  const handleDeleteDatabase = (id: string) => {
      if (confirm('Delete this database? Documents will remain in "All Documents".')) {
          setDatabases(prev => prev.filter(db => db.id !== id));
          // Unlink documents
          setDocuments(prev => {
              const updated = prev.map(doc => doc.databaseId === id ? { ...doc, databaseId: undefined } : doc);
              localStorage.setItem('inkflow_documents', JSON.stringify(updated));
              return updated;
          });
          if (currentDatabaseId === id) setCurrentDatabaseId(null);
      }
  };

  const handleCreateDoc = (targetDatabaseId?: string) => {
      const newDoc: Document = {
          id: Date.now().toString(),
          title: 'Untitled Page',
          content: '',
          status: DocumentStatus.DRAFT,
          databaseId: targetDatabaseId,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
      };
      setDocuments(prev => {
          const updated = [...prev, newDoc];
          localStorage.setItem('inkflow_documents', JSON.stringify(updated));
          return updated;
      });
      setCurrentDocId(newDoc.id);
  };

  const handleDeleteDoc = (id: string) => {
      if (confirm('Are you sure you want to delete this document?')) {
        setDocuments(prev => {
            const updated = prev.filter(d => d.id !== id);
            localStorage.setItem('inkflow_documents', JSON.stringify(updated));
            return updated;
        });
        if (currentDocId === id) setCurrentDocId(null);
      }
  };

  const handleSaveCMSConnection = (conn: CMSConnection) => {
      setCmsConnections(prev => [...prev, conn]);
  };

  const handleDeleteCMSConnection = (id: string) => {
      setCmsConnections(prev => prev.filter(c => c.id !== id));
  };

  const handleSetDocCMS = (cmsId: string) => {
      if (currentDocId) {
          setDocuments(prev => prev.map(d => d.id === currentDocId ? { ...d, cmsConnectionId: cmsId } : d));
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
       setSelectionRect({ top: e.clientY, left: e.clientX, width: 0, height: 0, right: e.clientX, bottom: e.clientY, x: e.clientX, y: e.clientY, toJSON: () => {} });
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
      else { try { recognitionRef.current?.start(); setIsListening(true); } catch(e){} }
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
                onSelectDatabase={(id) => { setCurrentDatabaseId(id); setCurrentDocId(null); }}
                onCreateDoc={() => handleCreateDoc(currentDatabaseId || undefined)}
                onCreateDatabase={handleCreateDatabase}
                onDeleteDatabase={handleDeleteDatabase}
                onGoToLibrary={() => { setCurrentDatabaseId(null); setCurrentDocId(null); }}
                cmsConnections={cmsConnections}
                onOpenCMSSettings={() => setCmsModalOpen(true)}
                onLogout={handleLogout}
            />
        )}

        {/* --- MAIN CONTENT AREA --- */}
        <div className="flex-1 flex flex-col h-full bg-nb-bg dark:bg-nb-darkBg min-w-0">
            
            {/* --- HEADER --- */}
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
                                    {saveStatus === 'saving' ? <Loader2 className="w-3 h-3 animate-spin"/> : <Check className="w-3 h-3"/>}
                                    {saveStatus}
                                </span>
                                <span>{content.trim() === '' ? 0 : content.trim().split(/\s+/).length} w</span>
                            </div>

                            <Tooltip content={isListening ? "Stop Voice" : "Start Voice"}>
                                <button onClick={toggleListening} className={`p-2 border-2 border-black dark:border-white rounded-full ${isListening ? 'bg-nb-red text-white animate-pulse' : 'hover:bg-gray-100'}`}>
                                    {isListening ? <MicOff className="w-4 h-4"/> : <Mic className="w-4 h-4"/>}
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
                                            <FileText className="w-4 h-4"/> Markdown
                                         </button>
                                         <button onClick={() => handleExport('txt')} className="px-4 py-2 hover:bg-nb-blue text-left text-sm font-bold uppercase flex gap-2">
                                            <AlignLeft className="w-4 h-4"/> Plain Text
                                         </button>
                                         <button onClick={() => handleExport('pdf')} className="px-4 py-2 hover:bg-nb-red text-left text-sm font-bold uppercase flex gap-2">
                                            <FileDown className="w-4 h-4"/> PDF
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

            {/* --- CONTENT --- */}
            <main className="flex-1 overflow-hidden relative">
                {currentDocId ? (
                    // EDITOR VIEW
                    <div className="h-full flex justify-center overflow-y-auto">
                        <div className={`relative h-full transition-all duration-300 w-full flex gap-6 p-4 ${showPreview ? 'max-w-7xl' : 'max-w-3xl'}`}>
                            {/* Editor Column */}
                            <div className={`relative h-full flex-1 flex flex-col ${showPreview ? 'hidden lg:flex' : ''}`}>
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
                        onOpenDoc={setCurrentDocId}
                        onDeleteDoc={handleDeleteDoc}
                        onCreateDoc={() => handleCreateDoc(currentDatabaseId || undefined)}
                    />
                )}
            </main>
        </div>

        {/* --- MODALS & OVERLAYS --- */}
        <DraftingSidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)} 
            onDraftInsert={insertTextAtCursor} 
            savedArticles={savedArticles}
            onRemoveArticle={uri => setSavedArticles(prev => prev.filter(a => a.uri !== uri))}
            cmsConnections={cmsConnections}
            onSetDocCMS={handleSetDocCMS}
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
                onSaveArticle={a => setSavedArticles(prev => [...prev, a])}
            />
        )}

        <SettingsModal
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            settings={promptSettings}
            onSave={s => { setPromptSettings(s); localStorage.setItem('inkflow_prompt_settings', JSON.stringify(s)); }}
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
