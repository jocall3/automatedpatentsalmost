// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.



import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { TextbookDocument, Section } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) throw new Error("API_KEY environment variable not set");

const ai = new GoogleGenAI({ apiKey: API_KEY });
const textModel = 'gemini-2.5-flash';
const imageModel = 'imagen-3.0-generate-002';

const outlineSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A formal, academic title for the textbook chapter. e.g., 'Chapter 1: Fundamentals of the Subject'." },
        sections: {
            type: Type.ARRAY,
            description: "An array of exactly 15 section objects for the chapter.",
            items: {
                type: Type.OBJECT,
                properties: {
                    section_number: { type: Type.STRING, description: "The section number, using the § symbol, e.g., '§1.1', '§1.2'." },
                    title: { type: Type.STRING, description: "The title of this specific section." },
                    summary: { type: Type.STRING, description: "A concise, one-sentence summary of what this section will cover. This will serve as a guide for writing the section's full text." },
                },
                required: ["section_number", "title", "summary"],
            },
        }
    },
    required: ["title", "sections"],
};

export const inferSubject = async (sourceMaterial: string): Promise<string> => {
    const prompt = `Analyze the following source material and determine its core subject.
Your response should be a concise, academic subject description suitable for a textbook chapter title or introduction.
For example, if the material is about quantum cryptography, a good response would be "The principles and applications of quantum cryptography in secure communication systems."

**Source Material:**
---
${sourceMaterial.slice(0, 100000)}
---

Based on the material, what is the core subject? Provide only the subject description as a single, formal sentence.`;

    const response = await ai.models.generateContent({
        model: textModel,
        contents: prompt,
    });
    
    return response.text.trim();
};

export const summarizeForImageContext = async (sourceMaterial: string): Promise<string> => {
    const prompt = `Analyze the following source material and create a dense, keyword-rich summary of the core visual concepts, objects, and aesthetics described or implied by the text. This summary will be used to guide an AI image generator. Focus on tangible nouns, evocative adjectives, and key technical terms.

**Source Material:**
---
${sourceMaterial.slice(0, 50000)}
---

Generate a comma-separated list of keywords and short phrases summarizing the visual essence of this document.`;
    
    const response = await ai.models.generateContent({
        model: textModel,
        contents: prompt,
    });

    return response.text.trim();
};


export const generateTextbookOutline = async (sourceMaterial: string, subject: string): Promise<{ title: string; sections: { section_number: string; title: string; summary: string }[] }> => {
    const prompt = `You are a university professor and author of a leading textbook. Your task is to create a chapter outline.

    **Chapter Subject:** ${subject}

    **Reference Material (use this as a "dictionary of facts" and inspiration for the new concepts):**
    ---
    ${sourceMaterial.slice(0, 100000)}
    ---

    Generate a textbook chapter outline. The chapter should be formal, structured, and academic in tone.
    The outline must have a formal chapter title and summaries for exactly 15 sections.
    Each section must have a section number (e.g., §1.1, §1.2), a title, and a one-sentence summary of its content.
    The content should be dense, authoritative, and suitable for an advanced, university-level textbook.

    The final output MUST be a JSON object matching the provided schema. Do not output anything else.`;

    const textResponse = await ai.models.generateContent({
        model: textModel,
        contents: prompt,
        config: { responseMimeType: 'application/json', responseSchema: outlineSchema }
    });

    let jsonString = textResponse.text.trim();
    if (jsonString.startsWith('```json')) {
        jsonString = jsonString.slice(7, -3).trim();
    } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.slice(3, -3).trim();
    }
    
    try {
        const parsed = JSON.parse(jsonString);
        if (!parsed.title || !Array.isArray(parsed.sections) || parsed.sections.length === 0) {
            throw new Error("Invalid outline structure received from AI.");
        }
        return parsed;
    } catch (e) {
        console.error("Failed to parse textbook outline JSON.", e);
        console.error("Malformed JSON string:", jsonString);
        throw new Error('AI returned an invalid JSON structure for the textbook outline.');
    }
};

export const generateSectionTextStream = async (sourceMaterial: string, summary: string, chapterTitle: string, subject: string, sectionTitle: string, sectionNumber: string) => {
    const prompt = `You are a university professor writing a section for a textbook chapter titled "${chapterTitle}".
The overall subject is: ${subject}.

The current section you are writing is "${sectionNumber} ${sectionTitle}".
The summary for this section is: "${summary}".

You MUST base your writing on the following reference material. Use it as a "dictionary of facts" to ensure accuracy and consistency. Do not invent information if the answer can be found in the reference material.

**Reference Material:**
---
${sourceMaterial.slice(0, 100000)}
---

Based on the summary and the reference material, write the full text for this section. The text should be dense, academic, and authoritative, suitable for an advanced computer science textbook.
- Write 2-3 detailed paragraphs.
- Use formal language.
- Where appropriate, invent and include formalisms like "Definition 1.1.1" or references to simulated results, but ensure they are conceptually aligned with the provided reference material.
- Do NOT include the section title or number in your output. Just write the body text for this section.`;

    return ai.models.generateContentStream({
        model: textModel,
        contents: prompt,
    });
};

export const generateHeaderImage = async (title: string, imageContextSummary: string): Promise<string> => {
    const prompt = `You are an art director for a high-end scientific publication. Create a visually stunning, professional header image for a textbook chapter titled "${title}".
The image must look like it was designed by a world-class web designer and photographer. It should be a sophisticated, abstract representation of the key technical components. The visual style MUST be derived from the core subject matter.

**Core Subject Matter & Visual Keywords to Inspire the Style:** ${imageContextSummary}

**Art Quality:** Photorealistic, award-winning design, UI/UX aesthetic, cinematic lighting, 8k resolution, sharp focus, high detail, epic scale, dramatic, professional photography.

**Negative prompt:** text, words, signature, watermark, cartoon, ugly, blurry, amateur, poor quality, low resolution, cluttered, disorganized, people, animals, quantum computing, circuit boards.`;
    try {
        const response = await ai.models.generateImages({
            model: imageModel,
            prompt: prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '16:9' },
        });
        return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
    } catch (e) {
        console.error("Header image generation failed", e);
        return "";
    }
};

export const generateDiagramImage = async (sectionText: string): Promise<string> => {
    const prompt = `You are a specialist in technical illustration. Your sole task is to create a clear, accurate diagram that visually represents the core concepts from the provided text snippet.

**CRITICAL INSTRUCTIONS:**
1.  **Strict Adherence to Text:** The diagram MUST be a direct visual translation of the concepts, processes, or architecture described in the "Section Content". Do not invent or add any elements not explicitly mentioned or clearly implied.
2.  **No Generic Schematics:** Avoid generating generic "tech" or "computer" imagery. If the text is about biology, create a biological diagram. If it's about finance, create a financial chart. The image content MUST match the text's subject matter.
3.  **Create a Diagram, Not a Scene:** Your output must be a technical diagram (e.g., flowchart, block diagram, schematic, graph), not a photorealistic scene, landscape, or artistic interpretation.

**Section Content to Illustrate:**
---
"${sectionText.slice(0, 2000)}"
---

**Style:** Clean, minimalist, academic, professional. Use clear lines and labels where appropriate (but do not add text words).

**ABSOLUTELY AVOID (Negative prompt):** quantum computing, circuit boards, abstract art, photographs of people or landscapes, painterly styles, cartoons, 3D scenes unless it's a direct model of a described object, words, watermarks, signatures, fantasy elements, cluttered layouts, ugly, blurry.`;

    try {
        const response = await ai.models.generateImages({
            model: imageModel,
            prompt: prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '16:9' },
        });
        return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
    } catch (e) {
        console.error("Image generation failed", e);
        return ""; // Return empty string on failure
    }
};