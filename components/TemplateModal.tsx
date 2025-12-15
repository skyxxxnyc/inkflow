
import React from 'react';
import { X, FileText, PenTool, BookOpen, Calendar, Briefcase, Coffee } from 'lucide-react';

export interface Template {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    content: string;
    defaultTitle: string;
    color: string;
}

export const TEMPLATES: Template[] = [
    {
        id: 'blog',
        title: 'Blog Post',
        description: 'Standard structure for engaging web content.',
        icon: <GlobeIcon className="w-6 h-6" />,
        defaultTitle: 'Untitled Blog Post',
        color: 'bg-nb-blue',
        content: `# [Catchy Title]

## Introduction
*Hook the reader and state the purpose of this post.*

## Key Point 1
Elaborate on your first main idea. Use data or examples to support it.

## Key Point 2
Elaborate on your second main idea.

## Conclusion
Summarize and provide a call to action.

---
*Keywords: [Insert Keywords]*`
    },
    {
        id: 'essay',
        title: 'Academic Essay',
        description: 'Structured argumentation with thesis and evidence.',
        icon: <BookOpen className="w-6 h-6" />,
        defaultTitle: 'Untitled Essay',
        color: 'bg-nb-yellow',
        content: `# [Essay Title]

## Introduction
*   **Hook**: Start with an engaging statement.
*   **Thesis Statement**: Clearly state your main argument.

## Body Paragraph 1
*   **Topic Sentence**: What is this paragraph about?
*   **Evidence**: Facts, quotes, or data.
*   **Analysis**: Explain how the evidence supports your thesis.

## Body Paragraph 2
*   **Topic Sentence**:
*   **Evidence**:
*   **Analysis**:

## Conclusion
Restate thesis and summarize main points. Do not introduce new information.`
    },
    {
        id: 'story',
        title: 'Short Story',
        description: 'Creative framework for fiction writers.',
        icon: <PenTool className="w-6 h-6" />,
        defaultTitle: 'Untitled Story',
        color: 'bg-nb-purple text-white',
        content: `# [Story Title]

## Premise
*A one-sentence summary of the story.*

## Characters
*   **Protagonist**: [Name/Description]
*   **Antagonist**: [Name/Description]

## Setting
Description of the world/location.

## Plot Outline
1.  **Inciting Incident**:
2.  **Rising Action**:
3.  **Climax**:
4.  **Falling Action**:
5.  **Resolution**:

---

## Draft
Start writing your story here...`
    },
    {
        id: 'meeting',
        title: 'Meeting Notes',
        description: 'Keep track of agendas and action items.',
        icon: <Calendar className="w-6 h-6" />,
        defaultTitle: 'Meeting Notes: [Date]',
        color: 'bg-nb-green',
        content: `# Meeting: [Topic]
**Date:** ${new Date().toLocaleDateString()}
**Attendees:** [Names]

## Agenda
1.  Item 1
2.  Item 2

## Discussion Notes
*   Note 1
*   Note 2

## Action Items
*   [ ] Task 1 (Owner)
*   [ ] Task 2 (Owner)
*   [ ] Task 3 (Owner)`
    },
    {
        id: 'proposal',
        title: 'Project Proposal',
        description: 'Pitch a new idea or project.',
        icon: <Briefcase className="w-6 h-6" />,
        defaultTitle: 'Project Proposal: [Name]',
        color: 'bg-nb-red text-white',
        content: `# Project Proposal: [Project Name]

## Executive Summary
Brief overview of the project and its value.

## Objectives
1.  Goal 1
2.  Goal 2

## Scope
*   **In Scope**:
*   **Out of Scope**:

## Timeline
*   **Phase 1**: [Date]
*   **Phase 2**: [Date]

## Budget
Estimated costs and resources.`
    },
    {
        id: 'journal',
        title: 'Daily Journal',
        description: 'Reflect on your day and set intentions.',
        icon: <Coffee className="w-6 h-6" />,
        defaultTitle: `Journal: ${new Date().toLocaleDateString()}`,
        color: 'bg-gray-800 text-white',
        content: `# Daily Journal - ${new Date().toLocaleDateString()}

## Mood
(Emoji or word)

## Gratitude
1.  I am grateful for...
2.  
3.  

## What happened today?
Free write about your day...

## Tomorrow's Intentions
*   Goal 1
*   Goal 2`
    }
];

function GlobeIcon(props: any) {
    return (
        <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
    )
}

interface TemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTemplate: (template: Template) => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({ isOpen, onClose, onSelectTemplate }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-nb-paper dark:bg-nb-darkPaper border-4 border-black dark:border-white shadow-neo w-full max-w-4xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b-2 border-black dark:border-white bg-nb-bg dark:bg-nb-darkBg">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter">
                            Choose a Template
                        </h2>
                        <p className="text-sm text-gray-500 font-serif italic">Start fast with a pre-defined structure.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-sm transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-black/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {TEMPLATES.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => onSelectTemplate(template)}
                                className="group flex flex-col text-left bg-white dark:bg-nb-darkPaper border-2 border-black dark:border-white shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo transition-all h-full"
                            >
                                <div className={`p-4 border-b-2 border-black dark:border-white flex items-center justify-between ${template.color}`}>
                                    <div className="p-2 bg-white/20 rounded-sm backdrop-blur-sm border border-white/20">
                                        {template.icon}
                                    </div>
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="font-bold text-lg uppercase mb-2 group-hover:underline decoration-2 underline-offset-2">
                                        {template.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 font-serif leading-relaxed mb-4 flex-1">
                                        {template.description}
                                    </p>
                                    <div className="text-xs font-bold uppercase tracking-wider opacity-40 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                        <FileText className="w-3 h-3" /> Use Template
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
