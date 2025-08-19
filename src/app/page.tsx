'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import DataIngestionPanel from "@/components/DataIngestionPanel";
import StoredDataPanel from "@/components/StoredDataPanel";
import ChatPanel from "@/components/ChatPanel";

export default function Home() {
  const [leftPanelWidth, setLeftPanelWidth] = useState(320);
  const [middlePanelWidth, setMiddlePanelWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [activeResize, setActiveResize] = useState<'left' | 'middle' | null>(null);
  
  const startXRef = useRef(0);
  const startLeftWidthRef = useRef(0);
  const startMiddleWidthRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent, resizeType: 'left' | 'middle') => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setActiveResize(resizeType);
    startXRef.current = e.clientX;
    startLeftWidthRef.current = leftPanelWidth;
    startMiddleWidthRef.current = middlePanelWidth;
    
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [leftPanelWidth, middlePanelWidth]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startXRef.current;
    
    if (activeResize === 'left') {
      const newWidth = Math.max(200, Math.min(500, startLeftWidthRef.current + deltaX));
      setLeftPanelWidth(newWidth);
    } else if (activeResize === 'middle') {
      const newWidth = Math.max(200, Math.min(500, startMiddleWidthRef.current + deltaX));
      setMiddlePanelWidth(newWidth);
    }
  }, [isResizing, activeResize]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setActiveResize(null);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  return (
    <div className="h-full flex bg-gray-900">
      <SignedOut>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">
              Welcome to RAG App
            </h1>
            <p className="text-gray-300 mb-8">
              Sign in to start using the Retrieval-Augmented Generation application
            </p>
          </div>
        </div>
      </SignedOut>
      
      <SignedIn>
        {/* Left Panel - Data Ingestion */}
        <div 
          className="bg-gray-900 flex flex-col border-r border-gray-700"
          style={{ 
            width: `${leftPanelWidth}px`, 
            minWidth: '200px', 
            maxWidth: '500px',
            flexShrink: 0 
          }}
        >
          <DataIngestionPanel />
        </div>
        
        {/* Left Resize Handle */}
        <div
          className={`w-1 bg-gray-600 hover:bg-blue-500 cursor-col-resize transition-colors ${
            isResizing && activeResize === 'left' ? 'bg-blue-500' : ''
          }`}
          onMouseDown={(e) => handleMouseDown(e, 'left')}
          style={{ flexShrink: 0 }}
        />
        
        {/* Middle Panel - Stored RAG Data */}
        <div 
          className="bg-gray-900 flex flex-col border-r border-gray-700"
          style={{ 
            width: `${middlePanelWidth}px`, 
            minWidth: '200px', 
            maxWidth: '500px',
            flexShrink: 0 
          }}
        >
          <StoredDataPanel />
        </div>
        
        {/* Middle Resize Handle */}
        <div
          className={`w-1 bg-gray-600 hover:bg-blue-500 cursor-col-resize transition-colors ${
            isResizing && activeResize === 'middle' ? 'bg-blue-500' : ''
          }`}
          onMouseDown={(e) => handleMouseDown(e, 'middle')}
          style={{ flexShrink: 0 }}
        />
        
        {/* Right Panel - Chat Interface */}
        <div className="flex-1 bg-gray-900 flex flex-col min-w-0">
          <ChatPanel />
        </div>
      </SignedIn>
    </div>
  );
}
