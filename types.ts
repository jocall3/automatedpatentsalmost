// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.



export type AppState = 'INPUT' | 'GENERATING' | 'VIEWING';

export type RobotState = 'idle' | 'thinking' | 'writing' | 'illustrating';

export interface Section {
  id: string;
  section_number: string; // e.g., "§9.1"
  title: string;
  summary?: string; // from outline
  section_text: string;
  images: string[]; // URLs for diagrams/figures
}

export interface TextbookDocument {
  id: string;
  title: string; // Chapter title, e.g., "Chapter 9: Advanced Compiler Systems"
  headerImageUrl?: string;
  sections: Section[];
}

export interface ExtractedTheme {
    id: string;
    title: string;
    description: string;
}

// Types for Story/Magazine generation
export type GenerationStatus = 'idle' | 'running' | 'paused' | 'complete';

export interface PageScaffold {
    id: string;
    page_number: number;
    page_text: string;
    ai_suggestions: string[];
    images: string[]; // URLs
}

export interface ChapterScaffold {
    id: string;
    title: string;
    summary: string;
    pages: PageScaffold[];
}

export interface StoryDocument {
    id: string;
    title: string;
    style: string;
    chapters: ChapterScaffold[];
    headerImageUrl?: string;
}

export interface PageHandlers {
    onUpdatePage: (chapterId: string, pageId: string, updates: Partial<PageScaffold>) => void;
    onAutoWritePageStream: (chapterId: string, pageId: string) => void;
    onExpandTextStream: (chapterId: string, pageId: string) => void;
    onGenerateImage: (chapterId: string, pageId: string) => void;
}

export interface EditorActions {
    onSuggestTitles: () => void;
    onSummarizeChapters: () => void;
    onAutoDraftAll: () => void;
}


// Add a declaration for the global libraries from the CDN
declare global {
    interface Window {
        pdfjsLib: any;
        jspdf: any;
        MathJax: any;
        PptxGenJS: any;
    }
}