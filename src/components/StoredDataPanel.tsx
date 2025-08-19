'use client';

import { useState } from 'react';

interface StoredDataItem {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
  url?: string;
}

export default function StoredDataPanel() {
  // Sample data matching the image
  const [items, setItems] = useState<StoredDataItem[]>([
    {
      id: '1',
      type: 'notes',
      title: 'Meeting Notes',
      description: 'Discussed project requirements and timeline',
      date: '15/01/2024'
    },
    {
      id: '2',
      type: 'document',
      title: 'Technical Documentation',
      description: 'API documentation for the new system',
      date: '14/01/2024'
    },
    {
      id: '3',
      type: 'website',
      title: 'React Documentation',
      description: 'Official React documentation and best practices',
      date: '13/01/2024',
      url: 'https://react.dev'
    }
  ]);

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'notes':
        return (
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'document':
        return (
          <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'website':
        return (
          <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      <div className="p-5 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h2 className="text-xl font-semibold">Stored RAG Data</h2>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <svg className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <p>No data stored yet</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      {getIcon(item.type)}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white mb-1">{item.title}</h3>
                        <p className="text-sm text-gray-300 mb-2">{item.description}</p>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400">{item.date}</span>
                          {item.url && (
                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:text-blue-300 underline"
                            >
                              {item.url}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors ml-2 flex-shrink-0 p-1"
                    aria-label="Delete item"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}