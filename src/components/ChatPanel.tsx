'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { RAGQueryRequest, RAGQueryResponse } from '@/types';
import SettingsModal, { getUserSettings, type UserSettings } from './SettingsModal';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: Array<{
    content: string;
    metadata: Record<string, string | number | boolean | undefined>;
    score?: number;
  }>;
}

// Helper function to get current time
function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false 
  });
}

// Local storage helper functions
const getChatStorageKey = (userId: string) => `rag-chat-${userId}`;

const saveMessagesToStorage = (userId: string, messages: Message[]) => {
  try {
    const key = getChatStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(messages));
  } catch (error) {
    console.warn('Failed to save messages to localStorage:', error);
  }
};

const loadMessagesFromStorage = (userId: string): Message[] => {
  try {
    const key = getChatStorageKey(userId);
    const stored = localStorage.getItem(key);
    if (stored) {
      const messages = JSON.parse(stored);
      // Validate the structure
      if (Array.isArray(messages) && messages.every(msg => 
        msg.id && msg.role && msg.content && msg.timestamp
      )) {
        return messages;
      }
    }
  } catch (error) {
    console.warn('Failed to load messages from localStorage:', error);
  }
  
  // Return default welcome message if no valid stored messages
  return [
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI assistant. I can help you query your stored documents, notes, and websites. What would you like to know?",
      timestamp: getCurrentTime()
    }
  ];
};

export default function ChatPanel() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages from localStorage when user changes
  useEffect(() => {
    if (user?.id) {
      const storedMessages = loadMessagesFromStorage(user.id);
      setMessages(storedMessages);
    }
  }, [user?.id]);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (user?.id && messages.length > 0) {
      saveMessagesToStorage(user.id, messages);
    }
  }, [user?.id, messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const clearChat = () => {
    const defaultMessage = {
      id: '1',
      role: 'assistant' as const,
      content: "Hello! I'm your AI assistant. I can help you query your stored documents, notes, and websites. What would you like to know?",
      timestamp: getCurrentTime()
    };
    setMessages([defaultMessage]);
    
    if (user?.id) {
      saveMessagesToStorage(user.id, [defaultMessage]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!user) {
      setError('Please sign in to chat with your documents');
      setTimeout(() => setError(null), 5000);
      return;
    }

    // Get user settings (API key is now optional - will fall back to environment)
    const userSettings = getUserSettings(user.id);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: getCurrentTime(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const requestBody: RAGQueryRequest = {
        question: input.trim(),
        apiKey: userSettings.apiKey,
        model: userSettings.model,
        includeMetadata: true,
        maxResults: 3,
        scoreThreshold: 0.7,
      };

      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: RAGQueryResponse = await response.json();
      
      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.answer,
          timestamp: getCurrentTime(),
          sources: data.sources,
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: getCurrentTime(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="h-full bg-gray-900 text-white flex flex-col">
        <div className="flex items-center space-x-2 p-3 md:p-4 border-b border-gray-700">
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <h2 className="text-lg md:text-xl font-semibold">Chat Interface</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-gray-400 mb-2">Please sign in to chat with your documents</p>
            <p className="text-gray-500 text-sm">Upload some documents first, then ask questions about them!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <h2 className="text-lg md:text-xl font-semibold">Chat Interface</h2>
          {isLoading && (
            <span className="text-xs text-blue-400 ml-2">AI is thinking...</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Settings"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={clearChat}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Clear chat history"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <div className="mx-3 md:mx-4 mt-3">
          <div className="bg-red-900 border border-red-700 text-red-200 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="flex flex-col space-y-2">
            <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[80%] ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-l-lg rounded-tr-lg' 
                  : 'bg-gray-800 text-gray-100 rounded-r-lg rounded-tl-lg border border-gray-700'
              } p-3 md:p-4`}>
                {message.role === 'assistant' && (
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-xs md:text-sm text-gray-400">AI Assistant</span>
                  </div>
                )}
                <p className="text-sm md:text-base whitespace-pre-wrap">{message.content}</p>
                
                {/* Show sources if available */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <p className="text-xs text-gray-400 mb-2">Sources:</p>
                    <div className="space-y-2">
                      {message.sources.slice(0, 3).map((source, index) => {
                                                const getSourceTitle = (source: any): string => {
                          // For websites, use pageTitle or hostname
                          if (source.metadata?.url && typeof source.metadata.url === 'string') {
                            if (source.metadata.pageTitle && typeof source.metadata.pageTitle === 'string') {
                              return source.metadata.pageTitle;
                            }
                            if (source.metadata.hostname && typeof source.metadata.hostname === 'string') {
                              return source.metadata.hostname;
                            }
                            try {
                              return new URL(source.metadata.url).hostname;
                            } catch {
                              return 'Website';
                            }
                          }
                          
                          // For files, use title or fileName
                          if (source.metadata?.title && typeof source.metadata.title === 'string') {
                            return source.metadata.title;
                          }
                          if (source.metadata?.fileName && typeof source.metadata.fileName === 'string') {
                            return source.metadata.fileName;
                          }
                          
                          return 'Document';
                        };

                        const sourceTitle = getSourceTitle(source);
                        const isWebsite = source.metadata?.url && typeof source.metadata.url === 'string';

                                                 return (
                           <div key={index} className="bg-gray-700 p-3 rounded-lg">
                             {/* Source Title/Link and Type */}
                             <div className="flex items-center justify-between">
                               {isWebsite ? (
                                 <a
                                   href={String(source.metadata.url)}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="text-blue-400 hover:text-blue-300 font-medium text-sm flex items-center gap-1 transition-colors flex-1 min-w-0 mr-2"
                                   title={`Open ${sourceTitle}`}
                                 >
                                   <span className="truncate">{sourceTitle}</span>
                                   <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                   </svg>
                                 </a>
                               ) : (
                                 <span className="text-gray-300 font-medium text-sm truncate flex-1 min-w-0 mr-2">
                                   {sourceTitle}
                                 </span>
                               )}
                               
                               {/* Content Type Badge */}
                               <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                                 source.metadata.contentType === 'url' 
                                   ? 'bg-green-900 text-green-200'
                                   : source.metadata.contentType === 'note'
                                   ? 'bg-blue-900 text-blue-200'
                                   : 'bg-yellow-900 text-yellow-200'
                               }`}>
                                 {source.metadata.contentType === 'url' ? 'Website' :
                                  source.metadata.contentType === 'note' ? 'Note' : 'Document'}
                               </span>
                             </div>
                           </div>
                         );
                      })}
                      
                      {/* Show more sources indicator */}
                      {message.sources.length > 3 && (
                        <div className="text-center">
                          <span className="text-xs text-gray-500">
                            +{message.sources.length - 3} more source{message.sources.length - 3 !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className={`text-xs text-gray-500 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
              {message.timestamp}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 rounded-r-lg rounded-tl-lg p-3 md:p-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 md:p-4 border-t border-gray-700">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your documents..."
            className="flex-1 p-2 md:p-3 bg-gray-800 border border-gray-600 rounded-lg text-sm md:text-base text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 md:p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}