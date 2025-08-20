import type { TextbookDocument } from '../types';

export const createPptx = async (doc: TextbookDocument): Promise<void> => {
    const pptx = new window.PptxGenJS();

    pptx.layout = 'LAYOUT_WIDE';
    
    // --- Title Slide ---
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: 'F1F1F1' };

    if (doc.headerImageUrl) {
        // PptxGenJS needs the base64 data without the data URI prefix
        const base64Data = doc.headerImageUrl.substring(doc.headerImageUrl.indexOf(',') + 1);
        titleSlide.addImage({
            data: `base64,${base64Data}`,
            x: 0, y: 0, w: '100%', h: '100%'
        });
    }

    titleSlide.addText(doc.title, {
        x: 0.5,
        y: '40%',
        w: '90%',
        h: 1,
        align: 'center',
        fontFace: 'Helvetica',
        fontSize: 48,
        bold: true,
        color: 'FFFFFF',
        // Add a shadow/outline for readability on any background
        shadow: { type: 'outer', color: '000000', blur: 3, offset: 3, angle: 45, opacity: 0.8 }
    });

    titleSlide.addText('An AI-Generated Textbook Addendum', {
        x: 0.5,
        y: '55%',
        w: '90%',
        h: 0.5,
        align: 'center',
        fontFace: 'Helvetica',
        fontSize: 24,
        color: 'FFFFFF',
        shadow: { type: 'outer', color: '000000', blur: 2, offset: 2, angle: 45, opacity: 0.7 }
    });


    // --- Content Slides ---
    for (const section of doc.sections) {
        const slide = pptx.addSlide();
        slide.background = { color: 'F5F5F5' };

        // Add a header
        slide.addText(`${section.section_number} ${section.title}`, {
            x: 0.5,
            y: 0.25,
            w: '90%',
            h: 0.5,
            fontFace: 'Helvetica',
            fontSize: 24,
            bold: true,
            color: '333333'
        });

        // Determine layout based on image presence
        if (section.images && section.images[0]) {
             const base64Data = section.images[0].substring(section.images[0].indexOf(',') + 1);
            // Layout with image on right, text on left
             slide.addText(section.section_text, {
                x: 0.5,
                y: 1,
                w: '45%',
                h: '80%',
                fontFace: 'Helvetica',
                fontSize: 12,
                color: '333333'
            });
            slide.addImage({
                data: `base64,${base64Data}`,
                x: '52%',
                y: 1,
                w: '45%',
                h: '80%',
                sizing: { type: 'contain', w: '45%', h: '80%' }
            });
        } else {
            // Full-width text layout
            slide.addText(section.section_text, {
                x: 0.5,
                y: 1,
                w: '90%',
                h: '80%',
                fontFace: 'Helvetica',
                fontSize: 14,
                color: '333333'
            });
        }
    }

    const fileName = `${doc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pptx`;
    await pptx.writeFile({ fileName });
};