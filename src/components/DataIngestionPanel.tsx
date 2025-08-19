'use client';

import { useState, useRef } from 'react';

export default function DataIngestionPanel() {
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    
    setIsLoading(true);
    try {
      // In a real app, you would send this to your API
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Notes added:', { type: 'text', content: textInput });
      setTextInput('');
    } catch (error) {
      console.error('Error adding notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('File uploaded:', { type: 'file', content: file.name });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Website added:', { type: 'url', content: urlInput });
      setUrlInput('');
    } catch (error) {
      console.error('Error adding website:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      <div className="p-5 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
          <h2 className="text-xl font-semibold">Data Ingestion</h2>
        </div>
      </div>
      
      <div className="flex-1 p-5 overflow-y-auto space-y-6">
        {/* Add Notes Manually Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-200">Add Notes Manually</h3>
          <div>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter your notes here..."
              rows={4}
              className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
            />
          </div>
          <button
            onClick={handleTextSubmit}
            disabled={isLoading || !textInput.trim()}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Notes
          </button>
        </div>

        {/* Upload PDF Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-200">Upload PDF</h3>
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf"
              className="hidden"
              id="file-upload"
              disabled={isLoading}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center justify-center"
            >
              <svg className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-sm text-gray-300">Click to upload PDF files</span>
            </label>
          </div>
        </div>

        {/* Add Website Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-200">Add Website</h3>
          <div>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com"
              className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}