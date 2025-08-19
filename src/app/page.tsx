"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import DataIngestionPanel from "@/components/DataIngestionPanel";
import StoredDataPanel from "@/components/StoredDataPanel";
import ChatPanel from "@/components/ChatPanel";

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ✅ Responsive initial panel width
  const getInitialWidth = useCallback(() => {
    if (typeof window !== "undefined") {
      const screenWidth = window.innerWidth;

      // Mobile breakpoint
      if (screenWidth < 768) {
        setIsMobile(true);
        return Math.min(screenWidth * 0.8, 300); // 80% of screen or max 300px
      }

      // Tablet and desktop
      setIsMobile(false);
      const calculated = screenWidth / 5; // More compact - divide by 5 instead of 4
      return Math.max(220, Math.min(320, calculated)); // More compact range
    }
    return 280; // fallback for SSR
  }, []);

  const [leftPanelWidth, setLeftPanelWidth] = useState(getInitialWidth);
  const [middlePanelWidth, setMiddlePanelWidth] = useState(getInitialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [activeResize, setActiveResize] = useState<"left" | "middle" | null>(
    null
  );

  const startXRef = useRef(0);
  const startLeftWidthRef = useRef(0);
  const startMiddleWidthRef = useRef(0);

  // Function to trigger refresh of document list
  const handleDocumentAdded = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, resizeType: "left" | "middle") => {
      if (isMobile) return; // Disable resizing on mobile

      e.preventDefault();
      e.stopPropagation();

      setIsResizing(true);
      setActiveResize(resizeType);
      startXRef.current = e.clientX;
      startLeftWidthRef.current = leftPanelWidth;
      startMiddleWidthRef.current = middlePanelWidth;

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [leftPanelWidth, middlePanelWidth, isMobile]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || isMobile) return;

      const deltaX = e.clientX - startXRef.current;
      const screenWidth = window.innerWidth;
      const maxWidth = Math.min(320, screenWidth * 0.25); // Max 25% of screen width

      if (activeResize === "left") {
        const newWidth = Math.max(
          200,
          Math.min(maxWidth, startLeftWidthRef.current + deltaX)
        );
        setLeftPanelWidth(newWidth);
      } else if (activeResize === "middle") {
        const newWidth = Math.max(
          200,
          Math.min(maxWidth, startMiddleWidthRef.current + deltaX)
        );
        setMiddlePanelWidth(newWidth);
      }
    },
    [isResizing, activeResize, isMobile]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setActiveResize(null);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  // ✅ Window resize handler for responsiveness
  useEffect(() => {
    const handleResize = () => {
      const newWidth = getInitialWidth();
      if (!isResizing) {
        setLeftPanelWidth(newWidth);
        setMiddlePanelWidth(newWidth);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [getInitialWidth, isResizing]);

  // Mobile layout - stack vertically
  if (isMobile) {
    return (
      <div className="h-full flex flex-col bg-gray-900">
        <SignedOut>
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-4">
                Welcome to RAG App
              </h1>
              <p className="text-gray-300 mb-8 text-sm">
                Sign in to start using the Retrieval-Augmented Generation
                application
              </p>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          {/* Mobile: Chat takes most space at top */}
          <div className="flex-1 bg-gray-900 flex flex-col min-h-0">
            <ChatPanel />
          </div>

          {/* Mobile: Panels in tabs or accordion below */}
          <div className="h-64 bg-gray-900 border-t border-gray-700 flex">
            <div className="flex-1 border-r border-gray-700">
              <DataIngestionPanel onDocumentAdded={handleDocumentAdded} />
            </div>
            <div className="flex-1">
              <StoredDataPanel refreshTrigger={refreshTrigger} />
            </div>
          </div>
        </SignedIn>
      </div>
    );
  }

  // Desktop layout - horizontal panels
  return (
    <div className="h-full flex bg-gray-900">
      <SignedOut>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">
              Welcome to RAG App
            </h1>
            <p className="text-gray-300 mb-8">
              Sign in to start using the Retrieval-Augmented Generation
              application
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
            minWidth: "200px",
            maxWidth: "320px", // More compact max width
            flexShrink: 0,
          }}
        >
          <DataIngestionPanel onDocumentAdded={handleDocumentAdded} />
        </div>

        {/* Left Resize Handle */}
        <div
          className={`w-1 bg-gray-600 hover:bg-blue-500 cursor-col-resize transition-colors ${
            isResizing && activeResize === "left" ? "bg-blue-500" : ""
          }`}
          onMouseDown={(e) => handleMouseDown(e, "left")}
          style={{ flexShrink: 0 }}
        />

        {/* Middle Panel - Stored RAG Data */}
        <div
          className="bg-gray-900 flex flex-col border-r border-gray-700"
          style={{
            width: `${middlePanelWidth}px`,
            minWidth: "200px",
            maxWidth: "320px", // More compact max width
            flexShrink: 0,
          }}
        >
          <StoredDataPanel refreshTrigger={refreshTrigger} />
        </div>

        {/* Middle Resize Handle */}
        <div
          className={`w-1 bg-gray-600 hover:bg-blue-500 cursor-col-resize transition-colors ${
            isResizing && activeResize === "middle" ? "bg-blue-500" : ""
          }`}
          onMouseDown={(e) => handleMouseDown(e, "middle")}
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
