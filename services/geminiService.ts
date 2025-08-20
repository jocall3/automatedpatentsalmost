
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
        title: { type: Type.STRING, description: "A formal, academic title for the textbook chapter. e.g., 'Chapter 7: Advanced Quantum Computation'." },
        sections: {
            type: Type.ARRAY,
            description: "An array of exactly 15 section objects for the chapter.",
            items: {
                type: Type.OBJECT,
                properties: {
                    section_number: { type: Type.STRING, description: "The section number, using the § symbol, e.g., '§7.1', '§7.2'." },
                    title: { type: Type.STRING, description: "The title of this specific section." },
                    summary: { type: Type.STRING, description: "A concise, one-sentence summary of what this section will cover. This will serve as a guide for writing the section's full text." },
                },
                required: ["section_number", "title", "summary"],
            },
        }
    },
    required: ["title", "sections"],
};

export const generateTextbookOutline = async (sourceMaterial: string, subject: string, style: string): Promise<{ title: string; sections: { section_number: string; title: string; summary: string }[] }> => {
    const prompt = `You are a university professor and author of a leading textbook on advanced computer science. Your task is to create a chapter outline for a new addendum to the 2025 edition.

    **Chapter Subject:** ${subject}
    **Illustration Style:** ${style}

    **Reference Material (use this as a "dictionary of facts" and inspiration for the new concepts):**
    ---
    ${sourceMaterial.slice(0, 100000)}
    ---

    Generate a textbook chapter outline. The chapter should be formal, structured, and academic in tone.
    The outline must have a formal chapter title (e.g., "Chapter 9: Emergent Braided Minds in Quantum Compiler Systems") and summaries for exactly 15 sections.
    Each section must have a section number (e.g., §9.1, §9.2), a title, and a one-sentence summary of its content.
    The content should be dense, authoritative, and suitable for an MIT-level textbook.

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

export const generateSectionTextStream = async (summary: string, chapterTitle: string, subject: string, style: string, sectionTitle: string, sectionNumber: string) => {
    const prompt = `You are a university professor writing a section for a textbook chapter titled "${chapterTitle}".
The overall subject is: ${subject}.
The illustration style is: ${style}.

The current section you are writing is "${sectionNumber} ${sectionTitle}".
The summary for this section is: "${summary}".

Based on this, write the full text for this section. The text should be dense, academic, and authoritative, suitable for an advanced computer science textbook.
- Write 2-3 detailed paragraphs.
- Use formal language.
- Where appropriate, invent and include formalisms like "Definition 9.1.1" or references to simulated results like "(Veridia-2024 lattice simulations)".
- Do NOT include the section title or number in your output. Just write the body text for this section.`;

    return ai.models.generateContentStream({
        model: textModel,
        contents: prompt,
    });
};

export const generateHeaderImage = async (title: string, style: string): Promise<string> => {
    const prompt = `Create a header illustration for a textbook chapter.
    Chapter Title: "${title}"
    Art Style: ${style}, abstract, conceptual, scientific.
    The image should be a sophisticated, abstract visualization of the core concepts, suitable for a university textbook.
    Negative prompt: text, words, signature, watermark, cartoonish, photo, fantasy.`;
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

export const generateDiagramImage = async (sectionText: string, style: string): Promise<string> => {
    const prompt = `Generate a technical diagram or abstract scientific illustration for a section of a computer science textbook.
Style: ${style}.
The section's content is about: "${sectionText.slice(0, 500)}".
The illustration should be clean, minimalist, and informative, like a figure in a scientific journal or textbook. It could be a flowchart, a conceptual graph, or an abstract representation of a process.
Negative prompt: ugly, blurry, deformed, watermark, text, signature, amateurish, fantasy, narrative scene.`;
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
