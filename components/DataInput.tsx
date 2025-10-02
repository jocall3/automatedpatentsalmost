// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.



import React, { useState } from 'react';
import { UploadIcon, SparklesIcon, DocumentIcon, XCircleIcon } from './Icons';

interface DataInputProps {
    onProcess: (data: string) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per file
const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100 MB total


const DataInput: React.FC<DataInputProps> = ({ onProcess }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const extractTextFromPdf = async (pdfFile: File): Promise<string> => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js`;
        const loadingTask = window.pdfjsLib.getDocument(URL.createObjectURL(pdfFile));
        const pdf = await loadingTask.promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n\n';
        }
        return fullText;
    };

    const extractTextFromTxt = (txtFile: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target?.result as string);
            reader.onerror = (error) => reject(error);
            reader.readAsText(txtFile);
        });
    };

    const handleFiles = (selectedFiles: FileList | null) => {
        if (selectedFiles) {
            setError(null);
            const newFiles = Array.from(selectedFiles);
            const allFiles = [...files, ...newFiles];

            let totalSize = 0;
            for(const file of allFiles) {
                if (file.size > MAX_FILE_SIZE) {
                    setError(`File "${file.name}" is too large. Maximum size is 10MB per file.`);
                    return;
                }
                if (file.type !== 'application/pdf' && file.type !== 'text/plain') {
                    setError(`File "${file.name}" is not a valid type. Please use PDF or TXT.`);
                    return;
                }
                totalSize += file.size;
            }

            if (totalSize > MAX_TOTAL_SIZE) {
                setError(`Total file size exceeds 100MB.`);
                return;
            }
            
            setFiles(allFiles);
        }
    };
    
    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files) handleFiles(e.target.files);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!files.length) return;

        setIsParsing(true);
        setError(null);
        try {
            const fileContents = await Promise.all(files.map(file => {
                return file.type === 'application/pdf' ? extractTextFromPdf(file) : extractTextFromTxt(file);
            }));
            const combinedText = fileContents.join('\n\n---\n\n');

            if (!combinedText.trim()) {
                 setError('Could not extract any text from the files.');
                 setIsParsing(false);
                 return;
            }
            onProcess(combinedText);
        } catch (err) {
            console.error("Failed to parse files", err);
            setError("Could not read one or more files. They might be corrupted or protected.");
            setIsParsing(false);
        }
    };

    const dropzoneClasses = dragActive ? "border-violet-400 bg-violet-900/30" : "border-gray-600 hover:border-gray-500";

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-full max-w-3xl">
                <UploadIcon className="mx-auto h-16 w-16 text-violet-400 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Provide Source Material</h2>
                <p className="text-gray-400 mb-6">
                    Upload documents to serve as inspiration. The AI will analyze your content and generate a complete, illustrated textbook chapter on the subject.
                </p>
                
                <form onSubmit={handleSubmit} className="w-full space-y-4">
                    <label 
                        htmlFor="file-upload"
                        className={`relative flex flex-col items-center justify-center w-full min-h-[9rem] p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${dropzoneClasses}`}
                        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                    >
                         {files.length === 0 ? (
                             <div className="text-center">
                                <p className="text-gray-400 mb-2">Drag & drop PDF or TXT files here, or click to select</p>
                                <p className="text-xs text-gray-500">Up to 100MB total</p>
                            </div>
                         ) : (
                             <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full text-left">
                                 {files.map((file, index) => (
                                     <div key={index} className="bg-gray-700/50 p-2 rounded-md flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                           <DocumentIcon className="w-5 h-5 flex-shrink-0 text-gray-400" />
                                           <span className="truncate">{file.name}</span>
                                        </div>
                                         <button type="button" onClick={() => removeFile(index)} className="p-0.5 rounded-full hover:bg-red-500/50">
                                            <XCircleIcon className="w-4 h-4" />
                                         </button>
                                     </div>
                                 ))}
                             </div>
                         )}
                        <input id="file-upload" type="file" multiple className="hidden" onChange={handleChange} accept="application/pdf,text/plain" />
                    </label>
                    
                    {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

                    <button
                        type="submit"
                        disabled={!files.length || isParsing}
                        className="mt-4 group relative inline-flex items-center justify-center px-8 py-3 text-lg font-bold text-white transition-all duration-200 bg-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                         <span className="absolute -inset-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 opacity-75 blur transition-all duration-1000 group-hover:opacity-100 group-hover:-inset-1 disabled:opacity-0"></span>
                         <SparklesIcon className="w-6 h-6 mr-3"/>
                         {isParsing ? 'Reading files...' : 'Generate Textbook Chapter'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default DataInput;