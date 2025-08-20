// Qdrant Point Structure as defined in README
export interface DocumentPoint {
  id: string;
  vector: number[]; // OpenAI embedding
  payload: {
    userId: string;
    documentId: string;
    contentType: 'note' | 'document' | 'url';
    title: string;
    content: string;
    chunk: string;
    chunkIndex: number;
    metadata: {
      fileName?: string;
      fileType?: string;
      url?: string;
      createdAt: string;
      updatedAt: string;
      tags?: string[];
    };
  };
}

// Document metadata interface
export interface DocumentMetadata {
  fileName?: string;
  fileType?: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  // Website-specific metadata
  hostname?: string;
  totalPages?: number;
  totalChunks?: number;
  crawlDepth?: number;
  crawledUrls?: string[];
}

// Processed document interface
export interface ProcessedDocument {
  id: string;
  title: string;
  contentType: 'note' | 'document' | 'url';
  chunks: DocumentChunk[];
  metadata: DocumentMetadata;
}

// Document chunk interface
export interface DocumentChunk {
  pageContent: string;
  metadata: {
    documentId: string;
    chunkIndex: number;
    userId?: string;
    [key: string]: any;
  };
}

// API Request/Response types

// Document upload request
export interface UploadDocumentRequest {
  file: File;
  title?: string;
}

// Note creation request
export interface CreateNoteRequest {
  content: string;
  title?: string;
  tags?: string[];
  apiKey: string; // User's OpenAI API key (required)
}

// Website processing options
export interface WebsiteProcessingOptions {
  maxDepth?: number;
  excludeDirs?: string[];
  maxPages?: number;
  sameDomainOnly?: boolean;
}

// URL processing request
export interface ProcessUrlRequest {
  url: string;
  title?: string;
  tags?: string[];
  crawlOptions?: WebsiteProcessingOptions;
  apiKey: string; // User's OpenAI API key (required)
}

// RAG query request
export interface RAGQueryRequest {
  question: string;
  apiKey: string; // User's OpenAI API key (required)
  model?: string; // OpenAI model to use
  includeMetadata?: boolean;
  maxResults?: number;
  scoreThreshold?: number;
}

// Document response
export interface DocumentResponse {
  success: boolean;
  documentId: string;
  title: string;
  contentType: 'note' | 'document' | 'url';
  chunksCount: number;
  metadata: DocumentMetadata;
  url?: string; // For URL documents
}

// Document list item
export interface DocumentListItem {
  id: string;
  title: string;
  contentType: 'note' | 'document' | 'url';
  metadata: DocumentMetadata;
  chunksCount: number;
  url?: string;
}

// Document list response
export interface DocumentListResponse {
  success: boolean;
  documents: DocumentListItem[];
  totalCount: number;
}

// RAG query response
export interface RAGQueryResponse {
  success: boolean;
  answer: string;
  sources: Array<{
    content: string;
    metadata: Record<string, any>;
    score?: number;
  }>;
  query: string;
  timestamp: string;
}

// Delete document response
export interface DeleteDocumentResponse {
  success: boolean;
  deletedDocumentId: string;
  message: string;
}

// API Error response
export interface APIErrorResponse {
  error: string;
  details?: string;
  code?: string;
}

// File validation types
export type SupportedFileType = 'application/pdf' | 'text/plain' | 'text/markdown' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const SUPPORTED_FILE_TYPES: SupportedFileType[] = [
  'application/pdf',
  'text/plain', 
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // DOCX
];

// Document processing status
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Enhanced document with processing status
export interface DocumentWithStatus extends DocumentListItem {
  status: ProcessingStatus;
  error?: string;
} 