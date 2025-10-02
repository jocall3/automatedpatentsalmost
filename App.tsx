// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.



import React, { useState, useEffect } from 'react';
import type { TextbookDocument, AppState, RobotState } from './types';
import * as gemini from './services/geminiService';
import { createPdf } from './services/pdfService';
import { createPptx } from './services/pptxService';
import { APP_TITLE } from './constants';
import { BookOpenIcon, DownloadIcon, BackArrowIcon, SparklesIcon } from './components/Icons';
import Loader from './components/Loader';
import DataInput from './components/DataInput';
import BookPreview from './components/BookPreview';
import Robot from './components/Robot';

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>('INPUT');
    const [textbookDocument, setTextbookDocument] = useState<TextbookDocument | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    // Robot State
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [robotState, setRobotState] = useState<RobotState>('idle');

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => setMousePosition({ x: e.clientX, y: e.clientY });
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleReset = () => {
        setAppState('INPUT');
        setTextbookDocument(null);
        setError(null);
        setIsLoading(false);
        setLoadingMessage('');
        setRobotState('idle');
    };

    const saveProgressToFile = (doc: TextbookDocument) => {
        try {
            const jsonString = JSON.stringify(doc, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const fileName = `textbook_progress_${doc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'untitled'}.json`;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log("Progress saved to", fileName);
        } catch (saveError) {
            console.error("Failed to save progress to file:", saveError);
        }
    };

    const handleGenerateTextbook = async (sourceMaterial: string) => {
        handleReset();
        setAppState('GENERATING');
        setIsLoading(true);
        setError(null);
        setRobotState('thinking');
        
        let currentDoc: TextbookDocument | null = null;

        try {
            setLoadingMessage('Analyzing source material to determine the subject...');
            const subject = await gemini.inferSubject(sourceMaterial);
            
            setLoadingMessage('Creating visual summary for illustrations...');
            const imageContextSummary = await gemini.summarizeForImageContext(sourceMaterial);

            setLoadingMessage('Generating textbook outline...');
            const outline = await gemini.generateTextbookOutline(sourceMaterial, subject);

            const initialDoc: TextbookDocument = {
                id: crypto.randomUUID(),
                title: outline.title,
                sections: outline.sections.map(s => ({
                    id: crypto.randomUUID(),
                    section_number: s.section_number,
                    title: s.title,
                    summary: s.summary,
                    section_text: '',
                    images: [],
                })).sort((a,b) => a.section_number.localeCompare(b.section_number, undefined, { numeric: true })),
            };
            
            currentDoc = initialDoc;
            setTextbookDocument(currentDoc);
            setAppState('VIEWING');
            setIsLoading(false);

            setLoadingMessage('Generating chapter header illustration...');
            setRobotState('illustrating');
            const headerImageUrl = await gemini.generateHeaderImage(outline.title, imageContextSummary);

            if (currentDoc) {
                currentDoc = { ...currentDoc, headerImageUrl };
                setTextbookDocument(currentDoc);
            }
            
            for (let i = 0; i < initialDoc.sections.length; i++) {
                const section = initialDoc.sections[i];
                setLoadingMessage(`Writing section ${i + 1} of ${initialDoc.sections.length}...`);
                setRobotState('writing');

                const stream = await gemini.generateSectionTextStream(sourceMaterial, section.summary!, outline.title, subject, section.title, section.section_number);
                
                let fullText = '';
                for await (const chunk of stream) {
                    fullText += chunk.text;
                    if(currentDoc) {
                        const newDoc = JSON.parse(JSON.stringify(currentDoc));
                        newDoc.sections[i].section_text = fullText;
                        currentDoc = newDoc;
                        setTextbookDocument(currentDoc);
                    }
                }

                setLoadingMessage(`Generating diagram for section ${i + 1}...`);
                setRobotState('illustrating');
                const imageUrl = await gemini.generateDiagramImage(fullText);
                if (imageUrl && currentDoc) {
                   const newDoc = JSON.parse(JSON.stringify(currentDoc));
                   newDoc.sections[i].images.push(imageUrl);
                   currentDoc = newDoc;
                   setTextbookDocument(currentDoc);
                }
            }

        } catch (err) {
            console.error(err);
            if (currentDoc) {
                saveProgressToFile(currentDoc);
                setError('An error occurred during generation. Your progress has been automatically saved to a JSON file. Please try again.');
            } else {
                setError('Failed to generate the textbook chapter. The AI might be having a creative block. Please try again.');
            }
            setAppState('INPUT');
        } finally {
            setIsLoading(false);
            setRobotState('idle');
            setLoadingMessage('');
        }
    };

    const handlePdfDownload = () => {
        if (!textbookDocument) return;
        setIsLoading(true);
        setLoadingMessage('Generating your textbook PDF...');
        setRobotState('thinking');
        try {
            createPdf(textbookDocument);
        } catch (err) {
            console.error(err);
            setError('Failed to create the PDF file.');
        } finally {
            setIsLoading(false);
            setRobotState('idle');
            setLoadingMessage('');
        }
    };

    const handlePptxDownload = async () => {
        if (!textbookDocument) return;
        setIsLoading(true);
        setLoadingMessage('Generating your PowerPoint presentation...');
        setRobotState('thinking');
        try {
            await createPptx(textbookDocument);
        } catch (err) {
            console.error(err);
            setError('Failed to create the PowerPoint file.');
        } finally {
            setIsLoading(false);
            setRobotState('idle');
            setLoadingMessage('');
        }
    };
    
    const renderContent = () => {
        if (appState === 'GENERATING' || (isLoading && appState !== 'VIEWING')) {
            return <Loader message={loadingMessage} />;
        }
        switch (appState) {
            case 'INPUT':
                return <DataInput onProcess={handleGenerateTextbook} />;
            case 'VIEWING':
                return textbookDocument ? (
                    <div className="h-[85vh] overflow-y-auto relative">
                        <BookPreview doc={textbookDocument} />
                        {loadingMessage && (
                           <div className="sticky bottom-4 w-11/12 mx-auto bg-gray-900/80 backdrop-blur-sm border border-gray-700 p-3 rounded-lg text-center text-sm z-20 flex items-center justify-center gap-2">
                                <SparklesIcon className="w-5 h-5 text-violet-400 animate-pulse" />
                                <p className="font-semibold text-gray-200">{loadingMessage}</p>
                            </div>
                        )}
                    </div>
                ) : <Loader message="Loading document..." />;
            default:
                return <DataInput onProcess={handleGenerateTextbook} />;
        }
    };

    return (
        <>
            <Robot robotState={robotState} mousePosition={mousePosition} />
            <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
                <div className="max-w-[120rem] mx-auto">
                    <header className="flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-3">
                            <BookOpenIcon className="w-8 h-8 text-violet-400" />
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text text-transparent">
                                {APP_TITLE}
                            </h1>
                        </div>
                         {appState !== 'INPUT' && (
                             <div className="flex items-center gap-4">
                                <button 
                                    onClick={handlePptxDownload}
                                    disabled={isLoading}
                                    className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                                >
                                    <DownloadIcon className="w-4 h-4"/>
                                    <span>Export PPTX</span>
                                </button>
                                <button 
                                    onClick={handlePdfDownload}
                                    disabled={isLoading}
                                    className="flex items-center space-x-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                                 >
                                     <DownloadIcon className="w-4 h-4"/>
                                     <span>Export PDF</span>
                                 </button>
                                 <button
                                    onClick={handleReset}
                                    disabled={isLoading}
                                    className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                 >
                                     <BackArrowIcon className="w-4 h-4"/>
                                     <span>Start Over</span>
                                 </button>
                             </div>
                        )}
                    </header>
                    
                    <main className="bg-gray-800/50 rounded-2xl shadow-2xl backdrop-blur-sm border border-gray-700/50 min-h-[70vh] overflow-hidden">
                        {error && (
                            <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg m-6 relative" role="alert">
                                <strong className="font-bold">Error: </strong>
                                <span className="block sm:inline">{error}</span>
                                <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">&times;</button>
                            </div>
                        )}
                        {renderContent()}
                    </main>
                </div>
            </div>
        </>
    );
};

export default App;