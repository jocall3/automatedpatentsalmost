// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import React from 'react';
import type { TextbookDocument } from '../types';

interface BookPreviewProps {
    doc: TextbookDocument;
}

const BookPreview: React.FC<BookPreviewProps> = ({ doc }) => {
    if (!doc) {
        return (
            <div className="p-6 text-center text-gray-500">
                <p>No document to preview.</p>
            </div>
        );
    }

    // This is a workaround to make MathJax re-render the content
    // when the document changes, in case any TeX/LaTeX is present.
    React.useEffect(() => {
        if (window.MathJax && typeof window.MathJax.typeset === 'function') {
            try {
                window.MathJax.typeset();
            } catch (e) {
                console.error("MathJax typesetting failed:", e);
            }
        }
    }, [doc]);

    return (
        <div className="book-preview p-6 sm:p-8">
            {doc.headerImageUrl && (
                <img src={doc.headerImageUrl} alt={`${doc.title} Header Illustration`} className="header-image" />
            )}

            <h1>{doc.title}</h1>

            {doc.sections.map(section => (
                <section key={section.id} className="mb-8">
                    <h2>{section.section_number} {section.title}</h2>
                    
                    {section.images && section.images[0] && (
                        <figure>
                            <img src={section.images[0]} alt={`Diagram for ${section.title}`} />
                            <figcaption>
                                Figure {section.section_number.replace('§', '')}: {section.summary || section.title}
                            </figcaption>
                        </figure>
                    )}

                    {section.section_text.split('\n').filter(p => p.trim() !== '').map((p, i) => (
                        <p key={`p-${section.id}-${i}`}>{p}</p>
                    ))}
                    {section.section_text.trim() === '' && <p className="italic text-gray-500">Section content is being generated...</p>}
                </section>
            ))}
        </div>
    );
};

export default BookPreview;
