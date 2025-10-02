// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import React from 'react';
import type { ExtractedTheme } from '../types';
import { SparklesIcon, LightbulbIcon } from './Icons';

interface ThemeSelectorProps {
    themes: ExtractedTheme[];
    onSelectTheme: (theme: ExtractedTheme) => void;
    onBack: () => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ themes, onSelectTheme, onBack }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-5xl text-center">
                <LightbulbIcon className="mx-auto h-16 w-16 text-violet-400 mb-4" />
                <h2 className="text-3xl font-bold text-white mb-2">Select a Narrative Theme</h2>
                <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                    The AI has analyzed your documents and generated several creative directions. Choose one to build your story around.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {themes.map((theme) => (
                        <div key={theme.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 flex flex-col text-left hover:border-violet-500 hover:scale-105 transition-all duration-200">
                            <h3 className="text-xl font-bold text-violet-300 mb-3">{theme.title}</h3>
                            <p className="text-gray-300 flex-grow mb-4">{theme.description}</p>
                            <button
                                onClick={() => onSelectTheme(theme)}
                                className="mt-auto group relative w-full inline-flex items-center justify-center px-4 py-2 text-md font-bold text-white transition-all duration-200 bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
                            >
                                <span className="absolute -inset-1 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 opacity-75 blur transition-all duration-1000 group-hover:opacity-100 group-hover:-inset-0.5"></span>
                                 <span className="relative flex items-center">
                                    <SparklesIcon className="w-5 h-5 mr-2"/>
                                    Generate Story
                                 </span>
                            </button>
                        </div>
                    ))}
                </div>
                 <button onClick={onBack} className="mt-12 text-gray-400 hover:text-white transition-colors">
                     &larr; Go back and change files
                 </button>
            </div>
        </div>
    );
};

export default ThemeSelector;
