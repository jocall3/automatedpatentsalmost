
import type { TextbookDocument } from '../types';

const preloadImageAsBase64 = (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!src || !src.startsWith('data:image')) {
      resolve(''); // Resolve with empty if no valid image
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = () => resolve(''); // Resolve with empty on error
    img.src = src;
  });
};

export const createPdf = async (doc: TextbookDocument): Promise<void> => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'pt',
        format: 'a4'
    });

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 50;
    const contentWidth = pageW - (margin * 2);
    let yPos = margin;
    let pageNum = 1;

    // --- Preload all images ---
    const sectionImageUrls = doc.sections.flatMap(p => p.images);
    const allImageUrls = doc.headerImageUrl ? [doc.headerImageUrl, ...sectionImageUrls] : sectionImageUrls;
    
    const preloadedImages = await Promise.all(allImageUrls.map(preloadImageAsBase64));
    const imageMap = new Map<string, string>();
    allImageUrls.forEach((url, index) => {
        if (preloadedImages[index]) {
            imageMap.set(url, preloadedImages[index]);
        }
    });

    // --- Title Page ---
    pdf.setFillColor(245, 245, 245);
    pdf.rect(0, 0, pageW, pageH, 'F');
    pdf.setTextColor(0, 0, 0);

    const headerImageBase64 = doc.headerImageUrl ? imageMap.get(doc.headerImageUrl) : null;
    if (headerImageBase64) {
        pdf.addImage(headerImageBase64, 'JPEG', 0, 0, pageW, pageH * 0.4);
    }
    
    pdf.setFontSize(32);
    pdf.setFont('helvetica', 'bold');
    const titleLines = pdf.splitTextToSize(doc.title, contentWidth * 0.9);
    const titleY = pageH / 2;
    pdf.text(titleLines, pageW / 2, titleY, { align: 'center' });
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.text('An AI-Generated Textbook Addendum', pageW / 2, titleY + (titleLines.length * 30) + 20, { align: 'center' });


    // --- Content Pages ---
    const addPageHeaderFooter = () => {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(100);
        pdf.text(doc.title, margin, margin / 2, { align: 'left' });
        pdf.text(`Page ${pageNum}`, pageW - margin, margin / 2, { align: 'right' });
        pdf.setTextColor(0);
    };
    
    pdf.addPage();
    addPageHeaderFooter();
    yPos = margin;


    for (const section of doc.sections) {
        // Section Title
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        const sectionTitle = `${section.section_number} ${section.title}`;
        const sectionTitleLines = pdf.splitTextToSize(sectionTitle, contentWidth);
        
        if (yPos + (sectionTitleLines.length * 20) > pageH - margin) {
            pageNum++;
            pdf.addPage();
            addPageHeaderFooter();
            yPos = margin;
        }

        pdf.text(sectionTitleLines, margin, yPos);
        yPos += (sectionTitleLines.length * 20) + 10;
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');

        // Draw Image if exists, as a figure
        const base64Image = section.images[0] ? imageMap.get(section.images[0]) : null;
        if (base64Image) {
             const imgH = 180;
             if (yPos + imgH + 30 > pageH - margin) {
                pageNum++;
                pdf.addPage();
                addPageHeaderFooter();
                yPos = margin;
             }
            pdf.addImage(base64Image, 'JPEG', margin, yPos, contentWidth, imgH);
            yPos += imgH + 5;
            
            // Figure caption
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'italic');
            const figCaption = `Figure ${section.section_number.replace('§', '')}: ${section.summary || section.title}`;
            const captionLines = pdf.splitTextToSize(figCaption, contentWidth);
            pdf.text(captionLines, pageW / 2, yPos, { align: 'center' });
            yPos += (captionLines.length * 12) + 15;
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
        }
        
        // Draw Text
        const textLines = pdf.splitTextToSize(section.section_text, contentWidth);
        textLines.forEach((line: string) => {
             if (yPos > pageH - margin) {
                pageNum++;
                pdf.addPage();
                addPageHeaderFooter();
                yPos = margin;
             }
            pdf.text(line, margin, yPos);
            yPos += 14; // Line height
        });
        
        yPos += 20; // Space between sections
    }

    const fileName = `${doc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
    pdf.save(fileName);
};