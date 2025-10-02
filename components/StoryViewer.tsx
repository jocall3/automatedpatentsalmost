// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useEffect, useRef } from 'react';
import type { StoryDocument, ChapterScaffold, PageScaffold, PageHandlers, EditorActions, GenerationStatus } from '../types';
import ChapterComponent from './PlanDisplay';
import MagazinePreview from './MagazinePreview';
import { PlusIcon, DocumentPlusIcon, WandIcon, ChatBubbleBottomCenterTextIcon, SparklesIcon, PlayIcon, StopIcon } from './Icons';

// Sub-component for generation status, included in this file to avoid creating new files.
interface GenerationStatusPanelProps {
    status: GenerationStatus;
    progress: { completed: number; total: number };
    onStop: () => void;
    onContinue: () => void;
}

const GenerationStatusPanel: React.FC<GenerationStatusPanelProps> = ({ status, progress, onStop, onContinue }) => {
    if (status === 'idle') return null;

    const progressPercentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
    
    const message = {
        running: `Generating... Page ${progress.completed + 1} of ${progress.total}`,
        paused: `Generation Paused. ${progress.completed}/${progress.total} pages complete.`,
        complete: `Generation Complete! All ${progress.total} pages are drafted.`,
    }[status];

    return (
        <div className="absolute bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm border-t border-gray-700 p-2 flex items-center justify-between text-sm z-20">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <SparklesIcon className={`w-5 h-5 flex-shrink-0 ${status === 'running' ? 'text-violet-400 animate-pulse' : 'text-gray-400'}`} />
                <div className="flex-grow min-w-0">
                    <p className="font-semibold text-gray-200 truncate">{message}</p>
                    {status !== 'complete' && (
                        <div className="w-full bg-gray-600 rounded-full h-1.5 mt-1">
                            <div className="bg-violet-500 h-1.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
                {status === 'running' && (
                    <button onClick={onStop} className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-500 rounded-md">
                        <StopIcon className="w-4 h-4" /> Stop
                    </button>
                )}
                {status === 'paused' && (
                    <button onClick={onContinue} className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-500 rounded-md">
                        <PlayIcon className="w-4 h-4" /> Continue
                    </button>
                )}
            </div>
        </div>
    );
};


interface StoryEditorProps {
    doc: StoryDocument;
    setDoc: React.Dispatch<React.SetStateAction<StoryDocument | null>>;
    pageHandlers: PageHandlers;
    editorActions: EditorActions;
    generationStatus: GenerationStatus;
    generationProgress: { completed: number; total: number };
    onStopGeneration: () => void;
    onContinueGeneration: () => void;
    isActionLoading: boolean;
}

const StoryEditor: React.FC<StoryEditorProps> = ({ 
    doc, setDoc, pageHandlers, editorActions, 
    generationStatus, generationProgress, onStopGeneration, onContinueGeneration, isActionLoading 
}) => {
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeChapterId, setActiveChapterId] = useState<string | null>(null);

    useEffect(() => {
        if (doc && doc.chapters.length > 0 && !activeChapterId) {
            setActiveChapterId(doc.chapters[0].id);
        }
    }, [doc, activeChapterId]);

    const handleUpdateDoc = (updater: (doc: StoryDocument) => StoryDocument) => {
        setDoc(prevDoc => prevDoc ? updater(prevDoc) : null);
    };

    const handleAddChapter = () => {
        const newPage: PageScaffold = {
            id: crypto.randomUUID(),
            page_number: 1,
            page_text: '',
            ai_suggestions: ['Start of the new chapter.'],
            images: [],
        };
        const newChapter: ChapterScaffold = {
            id: crypto.randomUUID(),
            title: `New Chapter ${doc.chapters.length + 1}`,
            summary: 'A new chapter.',
            pages: [newPage],
        };
        handleUpdateDoc(d => ({ ...d, chapters: [...d.chapters, newChapter] }));
        setActiveChapterId(newChapter.id);
    };

    const handleFileAppend = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // This is a placeholder for the more complex file reading and appending logic
        if (e.target.files && e.target.files[0]) {
             alert(`Appending from "${e.target.files[0].name}" is a future feature!`);
        }
    };
    
    const activeChapter = doc.chapters.find(c => c.id === activeChapterId);
    
    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[85vh] p-4">
            {/* Left Panel: Table of Contents & Actions */}
            <aside className="xl:col-span-3 bg-gray-900/60 p-4 rounded-lg border border-gray-700 flex flex-col">
                <h3 className="font-bold mb-3 text-violet-300">Table of Contents</h3>
                <div className="flex-grow overflow-y-auto space-y-1 pr-2 -mr-2">
                    {doc.chapters.map((chapter, index) => (
                        <button 
                            key={chapter.id} 
                            onClick={() => setActiveChapterId(chapter.id)}
                            className={`block w-full text-left p-2 rounded-md transition-colors text-sm ${activeChapterId === chapter.id ? 'bg-violet-900/50 text-white' : 'hover:bg-gray-700/50 text-gray-300'}`}
                        >
                            <span className="font-semibold text-gray-500 mr-2">{index + 1}.</span>
                            <span className="font-semibold">{chapter.title}</span>
                             <p className="text-xs text-gray-400 pl-6 truncate">{chapter.summary}</p>
                        </button>
                    ))}
                </div>
                 
                 <div className="mt-4 space-y-2 border-t border-gray-700 pt-4">
                    <button onClick={handleAddChapter} className="w-full flex items-center justify-center gap-2 text-sm p-2 bg-gray-700 hover:bg-gray-600 rounded-md">
                        <PlusIcon className="w-4 h-4" /> Add Chapter
                    </button>
                     <input type="file" ref={fileInputRef} onChange={handleFileAppend} className="hidden" accept="application/pdf,text/plain" />
                    <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 text-sm p-2 bg-gray-700 hover:bg-gray-600 rounded-md">
                        <DocumentPlusIcon className="w-4 h-4" /> Add Content
                    </button>
                    <div className="relative group">
                        <button disabled={isActionLoading} className="w-full flex items-center justify-center gap-2 text-sm p-2 bg-violet-600/80 hover:bg-violet-600 rounded-md disabled:opacity-50">
                            <WandIcon className="w-4 h-4"/> AI Assist
                        </button>
                        <div className="absolute bottom-full mb-2 w-full bg-gray-800 border border-gray-700 rounded-lg p-2 space-y-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                            <button onClick={editorActions.onSuggestTitles} className="w-full text-left text-sm p-2 hover:bg-gray-700 rounded-md flex items-center gap-2"><SparklesIcon className="w-4 h-4"/> Improve Chapter Titles</button>
                            <button onClick={editorActions.onSummarizeChapters} className="w-full text-left text-sm p-2 hover:bg-gray-700 rounded-md flex items-center gap-2"><ChatBubbleBottomCenterTextIcon className="w-4 h-4"/> Update Summaries</button>
                        </div>
                    </div>
                 </div>
            </aside>

            {/* Main Panel: Editor Canvas */}
            <div className="xl:col-span-5 overflow-y-auto pr-2 -mr-2 relative">
                <button onClick={editorActions.onAutoDraftAll} disabled={generationStatus === 'running' || generationStatus === 'complete'} className="w-full mb-4 flex items-center justify-center gap-2 p-3 bg-violet-800 hover:bg-violet-700 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                    <WandIcon className="w-5 h-5"/> {generationStatus === 'complete' ? 'Draft Complete' : 'AI, Write Full Draft'}
                </button>
                {activeChapter ? (
                    <ChapterComponent 
                        chapter={activeChapter} 
                        pageHandlers={pageHandlers}
                        isActionLoading={isActionLoading || generationStatus === 'running'}
                    />
                ) : (
                     <div className="flex items-center justify-center h-full text-gray-500">
                        <p>Select a chapter to begin editing.</p>
                    </div>
                )}
                <GenerationStatusPanel
                    status={generationStatus}
                    progress={generationProgress}
                    onStop={onStopGeneration}
                    onContinue={onContinueGeneration}
                />
            </div>

            {/* Right Panel: Live Magazine Preview */}
            <aside className="xl:col-span-4 bg-gray-900/60 p-4 rounded-lg border border-gray-700 overflow-y-auto">
                <MagazinePreview doc={doc} />
            </aside>
        </div>
    );
};

export default StoryEditor;
