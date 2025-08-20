import React, { useEffect } from 'react';
import type { TextbookDocument, StoryDocument } from '../types';

// Type guard to differentiate between document types at runtime
function isTextbookDocument(doc: TextbookDocument | StoryDocument): doc is TextbookDocument {
    return 'sections' in doc;
}

interface PreviewProps {
    doc: TextbookDocument | StoryDocument;
}

const MagazinePreview: React.FC<PreviewProps> = ({ doc }) => {

    useEffect(() => {
        if (window.MathJax) {
            window.MathJax.typesetPromise();
        }
    }, [doc]);

    // Renders the original textbook format
    if (isTextbookDocument(doc)) {
        return (
            <div className="p-6 textbook-preview">
                {doc.headerImageUrl && (
                    <div className="mb-8">
                        <img src={doc.headerImageUrl} alt={`${doc.title} Header Illustration`} className="header-image" />
                    </div>
                )}
                <h1>{doc.title}</h1>
                {doc.sections.map(section => (
                    <div key={section.id} className="mb-8">
                        <h2>{section.section_number} {section.title}</h2>

                        {section.section_text.split('\n').filter(p => p.trim() !== '').map((p, i) => (
                            <p key={`p-${section.id}-${i}`}>{p}</p>
                        ))}
                        
                        {section.images.map((imgSrc, i) => (
                            <figure key={`img-${section.id}-${i}`}>
                                <img src={imgSrc} alt={`Illustration for ${section.title}`} />
                                 <figcaption>
                                    <strong>Figure {section.section_number.replace('§', '')}.{i+1}:</strong> {section.summary || section.title}
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                ))}
            </div>
        );
    }
    
    // Renders a new, rich magazine/story format
    return (
        <div className="p-6 magazine-preview text-gray-300 leading-relaxed">
            {doc.headerImageUrl && (
                <div className="mb-10 rounded-lg overflow-hidden shadow-2xl">
                    <img src={doc.headerImageUrl} alt={`${doc.title} Header Illustration`} className="w-full h-auto object-cover" />
                </div>
            )}
            <h1 className="text-4xl font-bold mb-2 text-white tracking-tight">{doc.title}</h1>
            <p className="text-lg text-gray-400 mb-10">{doc.style}</p>
            
            {doc.chapters.map(chapter => (
                <div key={chapter.id} className="mb-12">
                    <h2 className="text-3xl font-semibold mb-2 text-violet-300 border-b-2 border-violet-800 pb-2">{chapter.title}</h2>
                    {chapter.summary && <p className="text-gray-400 italic mt-4 mb-6">{chapter.summary}</p>}
                    
                    {chapter.pages.map((page, pageIndex) => (
                        <div key={page.id} className={`mt-8 flex flex-col gap-8 ${page.images[0] ? (pageIndex % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse') : ''}`}>
                             {page.images[0] && (
                                <div className="md:w-1/2 flex-shrink-0">
                                    <figure>
                                        <img src={page.images[0]} alt={`Illustration for page ${page.page_number}`} className="rounded-lg shadow-lg w-full object-cover aspect-video" />
                                    </figure>
                                </div>
                            )}
                            <div className={page.images[0] ? "md:w-1/2" : "w-full"}>
                                {page.page_text.split('\n').filter(p => p.trim() !== '').map((p, i) => (
                                    <p key={`p-${page.id}-${i}`} className="mb-4">{p}</p>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default MagazinePreview;