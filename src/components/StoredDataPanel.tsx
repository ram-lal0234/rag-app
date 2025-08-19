"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import DocumentList from "./DocumentList";
import { DocumentListItem } from "@/types";

interface StoredDataPanelProps {
  refreshTrigger?: number; // Prop to trigger refresh from parent
}

export default function StoredDataPanel({
  refreshTrigger = 0,
}: StoredDataPanelProps) {
  const { user } = useUser();
  const [selectedDocument, setSelectedDocument] =
    useState<DocumentListItem | null>(null);

  const handleDocumentSelect = (document: DocumentListItem) => {
    setSelectedDocument(document);
    // You could show a modal or sidebar with document details here
    console.log("Selected document:", document);
  };

  const handleDocumentDelete = (documentId: string) => {
    // Clear selection if the deleted document was selected
    if (selectedDocument?.id === documentId) {
      setSelectedDocument(null);
    }
    console.log("Document deleted:", documentId);
  };

  if (!user) {
    return (
      <div className="h-full bg-gray-900 text-white flex flex-col">
        <div className="flex items-center space-x-2 p-3 md:p-4 border-b border-gray-700">
          <svg
            className="w-5 h-5 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
            />
          </svg>
          <h2 className="text-lg md:text-xl font-semibold">Stored Data</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-gray-400 text-center">
            Please sign in to view your stored documents
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-2 p-3 md:p-4 border-b border-gray-700">
        <svg
          className="w-5 h-5 text-green-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
          />
        </svg>
        <h2 className="text-lg md:text-xl font-semibold">Stored Data</h2>
        {selectedDocument && (
          <div className="flex-1 text-right">
            <span className="text-xs text-blue-400">
              Selected: {selectedDocument.title}
            </span>
          </div>
        )}
      </div>

      {/* Document List */}
      <div className="flex-1 p-3 md:p-4 min-h-0">
        <DocumentList
          onDocumentSelect={handleDocumentSelect}
          onDocumentDelete={handleDocumentDelete}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </div>
  );
}
