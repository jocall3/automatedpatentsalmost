// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React from 'react';
import type { StoryDocument } from '../types';

interface MagazinePreviewProps {
    doc: StoryDocument;
}

const MagazinePreview: React.FC<MagazinePreviewProps> = ({ doc }) => {
    if (!doc) {
        return (
            <div className="p-6 text-center text-gray-500">
                <p>No document to preview.</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 magazine-preview text-gray-200">
            {doc.headerImageUrl ? (
                <div className="mb-8 relative h-72 rounded-lg overflow-hidden shadow-2xl">
                    <img src={doc.headerImageUrl} alt={`${doc.title} Header Illustration`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                        <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">{doc.title}</h1>
                    </div>
                </div>
            ) : (
                <h1 className="text-4xl lg:text-5xl font-bold mb-8 text-white border-b-2 border-gray-700 pb-4">{doc.title}</h1>
            )}

            {doc.chapters.map(chapter => (
                <div key={chapter.id} className="mb-12">
                    <h2 className="text-3xl font-bold text-violet-300 mb-6 relative">
                        <span className="bg-gray-900/60 pr-4">{chapter.title}</span>
                        <span className="absolute left-0 top-1/2 w-full h-px bg-gray-700 -z-10"></span>
                    </h2>
                    
                    {chapter.pages.map(page => (
                        <div key={page.id} className="mb-8 p-4 bg-gray-800/40 rounded-lg border border-gray-700/50">
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                                <div className={`${page.images.length > 0 ? 'lg:col-span-3' : 'lg:col-span-5'}`}>
                                    <h3 className="font-semibold text-lg text-violet-400 mb-2">Page {page.page_number}</h3>
                                    <div className="prose prose-invert max-w-none text-gray-300 prose-p:mb-3">
                                        {page.page_text.split('\n').filter(p => p.trim() !== '').map((p, i) => (
                                            <p key={`p-${page.id}-${i}`}>{p}</p>
                                        ))}
                                        {page.page_text.trim() === '' && <p className="italic text-gray-500">Page content is being generated...</p>}
                                    </div>
                                </div>
                                
                                {page.images.length > 0 && (
                                    <div className="lg:col-span-2 space-y-4">
                                        {page.images.map((imgSrc, i) => (
                                            <figure key={`img-${page.id}-${i}`} className="rounded-lg overflow-hidden shadow-lg border border-gray-700">
                                                <img src={imgSrc} alt={`Illustration for page ${page.page_number}`} className="w-full h-auto object-cover"/>
                                            </figure>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default MagazinePreview;
