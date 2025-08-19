"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  DocumentListItem,
  DocumentListResponse,
  DeleteDocumentResponse,
} from "@/types";

interface DocumentListProps {
  onDocumentDelete?: (documentId: string) => void;
  onDocumentSelect?: (document: DocumentListItem) => void;
  refreshTrigger?: number; // Prop to trigger refresh from parent
}

export default function DocumentList({
  onDocumentDelete,
  onDocumentSelect,
  refreshTrigger = 0,
}: DocumentListProps) {
  const { user } = useUser();
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Fetch documents from API
  const fetchDocuments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/documents", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: DocumentListResponse = await response.json();

      if (data.success) {
        setDocuments(data.documents);
      } else {
        throw new Error("Failed to fetch documents");
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load documents"
      );
    } finally {
      setLoading(false);
    }
  };

  // Delete document
  const handleDelete = async (documentId: string) => {
    if (!user) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this document? This action cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      setDeletingIds((prev) => new Set(prev).add(documentId));

      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: DeleteDocumentResponse = await response.json();

      if (data.success) {
        // Remove document from local state
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));

        // Notify parent component
        onDocumentDelete?.(documentId);
      } else {
        throw new Error("Failed to delete document");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete document"
      );
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  // Get icon based on content type
  const getIcon = (
    contentType: "note" | "document" | "url",
    fileType?: string
  ) => {
    switch (contentType) {
      case "note":
        return (
          <svg
            className="w-4 h-4 md:w-5 md:h-5 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        );
      case "url":
        return (
          <svg
            className="w-4 h-4 md:w-5 md:h-5 text-green-400"
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
        );
      case "document":
        if (fileType === "pdf") {
          return (
            <svg
              className="w-4 h-4 md:w-5 md:h-5 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          );
        } else if (fileType === "docx") {
          return (
            <svg
              className="w-4 h-4 md:w-5 md:h-5 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          );
        }
        return (
          <svg
            className="w-4 h-4 md:w-5 md:h-5 text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-4 h-4 md:w-5 md:h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Effect to fetch documents on mount and refresh trigger changes
  useEffect(() => {
    fetchDocuments();
  }, [user, refreshTrigger]);

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-gray-400 text-sm">
          Please sign in to view your documents
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-400 text-sm">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 text-sm mb-2">{error}</p>
          <button
            onClick={fetchDocuments}
            className="text-blue-400 hover:text-blue-300 text-sm underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <svg
            className="w-12 h-12 text-gray-600 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-gray-400 text-sm mb-2">No documents yet</p>
          <p className="text-gray-500 text-xs">
            Upload files, add notes, or save URLs to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="p-3 md:p-4 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-750 transition-colors cursor-pointer"
            onClick={() => onDocumentSelect?.(doc)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0 mt-1">
                  {getIcon(doc.contentType, doc.metadata.fileType)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm md:text-base font-medium text-white truncate">
                    {doc.title}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-400">
                      {doc.chunksCount} chunk{doc.chunksCount !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-400">
                      {formatDate(doc.metadata.createdAt)}
                    </span>
                  </div>
                  {doc.metadata.tags && doc.metadata.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {doc.metadata.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-900 text-blue-200 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {doc.metadata.tags.length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{doc.metadata.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(doc.id);
                }}
                disabled={deletingIds.has(doc.id)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                title="Delete document"
              >
                {deletingIds.has(doc.id) ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                ) : (
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
