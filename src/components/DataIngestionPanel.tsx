'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface DataIngestionPanelProps {
  onDataIngested: (data: { type: string; content: string; title: string }) => void;
}

export default function DataIngestionPanel({ onDataIngested }: DataIngestionPanelProps) {
  const [textInput, setTextInput] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [fileTitle, setFileTitle] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextSubmit = async () => {
    if (!textInput.trim() || !textTitle.trim()) return;
    
    setIsLoading(true);
    try {
      // In a real app, you would send this to your API
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onDataIngested({
        type: 'text',
        content: textInput,
        title: textTitle
      });
      
      setTextInput('');
      setTextTitle('');
    } catch (error) {
      console.error('Error ingesting text:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !fileTitle.trim()) return;
    
    const file = e.target.files[0];
    setIsLoading(true);
    
    try {
      // In a real app, you would upload the file to your API
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onDataIngested({
        type: 'file',
        content: file.name, // In a real app, this would be the processed content
        title: fileTitle
      });
      
      setFileTitle('');
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
    if (!urlInput.trim() || !urlTitle.trim()) return;
    
    setIsLoading(true);
    try {
      // In a real app, you would send this URL to your API for scraping
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onDataIngested({
        type: 'url',
        content: urlInput,
        title: urlTitle
      });
      
      setUrlInput('');
      setUrlTitle('');
    } catch (error) {
      console.error('Error processing URL:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden h-full">
      <div className="p-5 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Data Ingestion</h2>
      </div>
      
      <div className="p-5">
        <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4">
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'text' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600 dark:text-slate-400'}`}
            onClick={() => setActiveTab('text')}
          >
            Text Input
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'file' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600 dark:text-slate-400'}`}
            onClick={() => setActiveTab('file')}
          >
            Upload PDF
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'url' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600 dark:text-slate-400'}`}
            onClick={() => setActiveTab('url')}
          >
            Website
          </button>
        </div>
        
        {activeTab === 'text' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="text-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Title
              </label>
              <input
                id="text-title"
                type="text"
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                placeholder="Enter a title for your notes"
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="text-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Notes
              </label>
              <textarea
                id="text-input"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter your notes here..."
                rows={6}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-800 dark:text-white resize-none"
              />
            </div>
            <button
              onClick={handleTextSubmit}
              disabled={isLoading || !textInput.trim() || !textTitle.trim()}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Processing...' : 'Submit'}
            </button>
          </div>
        )}
        
        {activeTab === 'file' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="file-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Document Title
              </label>
              <input
                id="file-title"
                type="text"
                value={fileTitle}
                onChange={(e) => setFileTitle(e.target.value)}
                placeholder="Enter a title for your document"
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              />
            </div>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.csv,.txt,.docx"
                className="hidden"
                id="file-upload"
                disabled={isLoading || !fileTitle.trim()}
              />
              <label
                htmlFor="file-upload"
                className={`cursor-pointer flex flex-col items-center justify-center ${!fileTitle.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-slate-600 dark:text-slate-300">Click to upload or drag and drop</span>
                <span className="text-xs text-slate-500 mt-1">PDF, CSV, TXT, DOCX</span>
              </label>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Note: Please enter a document title before uploading a file.
            </p>
          </div>
        )}
        
        {activeTab === 'url' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="url-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Website Title
              </label>
              <input
                id="url-title"
                type="text"
                value={urlTitle}
                onChange={(e) => setUrlTitle(e.target.value)}
                placeholder="Enter a title for this website"
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="url-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Website URL
              </label>
              <input
                id="url-input"
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com"
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              />
            </div>
            <button
              onClick={handleUrlSubmit}
              disabled={isLoading || !urlInput.trim() || !urlTitle.trim()}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Processing...' : 'Scrape Website'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}