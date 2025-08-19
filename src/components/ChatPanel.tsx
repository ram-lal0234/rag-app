'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI assistant. I can help you query your stored documents, notes, and websites. What would you like to know?",
      timestamp: '21:24:22'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: getCurrentTime()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // In a real app, you would call your API here
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate streaming by adding characters one by one
      const response = "This is a simulated response from the RAG system based on your query. In a real application, this would retrieve relevant documents from Qdrant and generate a response using OpenAI.";
      let partialResponse = "";
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "",
        timestamp: getCurrentTime()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      for (let i = 0; i < response.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 20));
        partialResponse += response[i];
        
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: partialResponse
          };
          return updated;
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      <div className="p-5 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <h2 className="text-xl font-semibold">AI Chat Interface</h2>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
              {message.role === 'assistant' && (
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-800 text-white p-3 rounded-lg rounded-tl-none">
                      {message.content}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 ml-1">{message.timestamp}</div>
                  </div>
                </div>
              )}
              {message.role === 'user' && (
                <div className="flex items-end gap-3">
                  <div className="flex-1 text-right">
                    <div className="bg-blue-600 text-white p-3 rounded-lg rounded-tr-none inline-block">
                      {message.content}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 mr-1">{message.timestamp}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-gray-700 bg-gray-900">
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask questions about your data..."
            disabled={isLoading}
            className="flex-1 p-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 rounded-lg bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}