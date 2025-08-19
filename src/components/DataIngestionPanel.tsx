"use client";

import { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import {
  DocumentResponse,
  CreateNoteRequest,
  ProcessUrlRequest,
} from "@/types";

interface DataIngestionPanelProps {
  onDocumentAdded?: () => void; // Callback to refresh document list
}

export default function DataIngestionPanel({
  onDocumentAdded,
}: DataIngestionPanelProps) {
  const { user } = useUser();
  const [textInput, setTextInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear notifications after a delay
  const clearNotifications = () => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    if (!user) {
      setError("Please sign in to add notes");
      clearNotifications();
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const requestBody: CreateNoteRequest = {
        content: textInput.trim(),
        title: textInput.trim().split("\n")[0].substring(0, 50) || "Quick Note", // Use first line as title
      };

      const response = await fetch("/api/documents/note", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data: DocumentResponse = await response.json();

      if (data.success) {
        setSuccess(`Note "${data.title}" added successfully!`);
        setTextInput("");
        onDocumentAdded?.(); // Refresh document list
      } else {
        throw new Error("Failed to add note");
      }
    } catch (error) {
      console.error("Error adding notes:", error);
      setError(error instanceof Error ? error.message : "Failed to add note");
    } finally {
      setIsLoading(false);
      clearNotifications();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    if (!user) {
      setError("Please sign in to upload files");
      clearNotifications();
      return;
    }

    const file = e.target.files[0];

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a PDF, TXT, MD, or DOCX file");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      clearNotifications();
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data: DocumentResponse = await response.json();

      if (data.success) {
        setSuccess(
          `File "${data.title}" processed successfully! (${data.chunksCount} chunks created)`
        );
        onDocumentAdded?.(); // Refresh document list
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        throw new Error("Failed to process file");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setError(
        error instanceof Error ? error.message : "Failed to upload file"
      );
    } finally {
      setIsLoading(false);
      clearNotifications();
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    if (!user) {
      setError("Please sign in to add websites");
      clearNotifications();
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const requestBody: ProcessUrlRequest = {
        url: urlInput.trim(),
      };

      const response = await fetch("/api/documents/url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data: DocumentResponse = await response.json();

      if (data.success) {
        setSuccess(
          `Website "${data.title}" processed successfully! (${data.chunksCount} chunks created)`
        );
        setUrlInput("");
        onDocumentAdded?.(); // Refresh document list
      } else {
        throw new Error("Failed to process website");
      }
    } catch (error) {
      console.error("Error processing URL:", error);
      setError(
        error instanceof Error ? error.message : "Failed to process website"
      );
    } finally {
      setIsLoading(false);
      clearNotifications();
    }
  };

  if (!user) {
    return (
      <div className="h-full bg-gray-900 text-white flex flex-col">
        <div className="flex items-center space-x-2 p-3 md:p-4 border-b border-gray-700">
          <svg
            className="w-5 h-5 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <h2 className="text-lg md:text-xl font-semibold">Data Ingestion</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-gray-400 text-center">
            Please sign in to upload documents and add content
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
          className="w-5 h-5 text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <h2 className="text-lg md:text-xl font-semibold">Data Ingestion</h2>
      </div>

      {/* Notifications */}
      {(error || success) && (
        <div className="mx-3 md:mx-4 mt-3">
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-900 border border-green-700 text-green-200 px-3 py-2 rounded-lg text-sm">
              {success}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
        {/* Add Notes Manually */}
        <div className="space-y-2 md:space-y-3">
          <h3 className="text-sm md:text-base font-medium">
            Add Notes Manually
          </h3>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type your notes here..."
            className="w-full p-2 md:p-3 bg-gray-800 border border-gray-600 rounded-lg text-sm md:text-base text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            disabled={isLoading}
          />
          <button
            onClick={handleTextSubmit}
            disabled={!textInput.trim() || isLoading}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 md:p-3 rounded-lg font-medium transition-colors text-sm md:text-base"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span>{isLoading ? "Adding..." : "Add Notes"}</span>
          </button>
        </div>

        {/* Upload PDF */}
        <div className="space-y-2 md:space-y-3">
          <h3 className="text-sm md:text-base font-medium">Upload Document</h3>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            accept=".pdf,.txt,.md,.docx"
            className="w-full p-2 md:p-3 bg-gray-800 border border-gray-600 rounded-lg text-sm md:text-base text-white file:mr-4 file:py-1 md:file:py-2 file:px-3 md:file:px-4 file:rounded-lg file:border-0 file:text-xs md:file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-400">
            Supports PDF, TXT, MD, and DOCX files
          </p>
        </div>

        {/* Add Website */}
        <div className="space-y-2 md:space-y-3">
          <h3 className="text-sm md:text-base font-medium">Add Website</h3>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com"
            className="w-full p-2 md:p-3 bg-gray-800 border border-gray-600 rounded-lg text-sm md:text-base text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={handleUrlSubmit}
            disabled={!urlInput.trim() || isLoading}
            className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 md:p-3 rounded-lg font-medium transition-colors text-sm md:text-base"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <span>{isLoading ? "Processing..." : "Add Website"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
