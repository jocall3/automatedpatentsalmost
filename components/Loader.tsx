// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React from 'react';
import { SparklesIcon } from './Icons';

interface LoaderProps {
    message: string;
    subMessage?: string;
}

const Loader: React.FC<LoaderProps> = ({ message, subMessage }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="relative">
                <div className="w-24 h-24 border-4 border-dashed rounded-full animate-spin border-violet-400"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <SparklesIcon className="w-10 h-10 text-violet-400" />
                </div>
            </div>
            <p className="mt-6 text-lg font-medium text-gray-300">{message}</p>
            {subMessage && <p className="mt-2 text-sm text-gray-400">{subMessage}</p>}
        </div>
    );
};

export default Loader;
