import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { v4 as uuidv4 } from "uuid";
import {
  SUPPORTED_FILE_TYPES,
  type SupportedFileType,
  type DocumentChunk,
} from "@/types";

// Text splitter configuration following README requirements
export const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 100,
});

export interface ProcessedDocument {
  id: string;
  title: string;
  contentType: "note" | "document" | "url";
  chunks: DocumentChunk[];
  metadata: {
    fileName?: string;
    fileType?: string;
    url?: string;
    createdAt: string;
    updatedAt: string;
    tags?: string[];
  };
}

export async function processPDFFile(
  file: File,
  title?: string
): Promise<ProcessedDocument> {
  try {
    // Create a temporary blob URL for the PDFLoader
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: "application/pdf" });

    // Use LangChain PDFLoader
    const loader = new PDFLoader(blob);
    const docs = await loader.load();

    // Split documents into chunks
    const chunks = await textSplitter.splitDocuments(docs);

    const documentId = uuidv4();
    const processedDoc: ProcessedDocument = {
      id: documentId,
      title: title || file.name,
      contentType: "document",
      chunks: chunks.map(
        (chunk, index): DocumentChunk => ({
          pageContent: chunk.pageContent,
          metadata: {
            ...chunk.metadata,
            documentId,
            chunkIndex: index,
            fileName: file.name,
            fileType: "pdf",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        })
      ),
      metadata: {
        fileName: file.name,
        fileType: "pdf",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    return processedDoc;
  } catch (error) {
    console.error("Error processing PDF file:", error);
    throw new Error(
      `Failed to process PDF file: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function processDocxFile(
  file: File,
  title?: string
): Promise<ProcessedDocument> {
  try {
    // Create a temporary blob URL for the DocxLoader
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    // Use LangChain DocxLoader
    const loader = new DocxLoader(blob);
    const docs = await loader.load();

    // Split documents into chunks
    const chunks = await textSplitter.splitDocuments(docs);

    const documentId = uuidv4();
    const processedDoc: ProcessedDocument = {
      id: documentId,
      title: title || file.name,
      contentType: "document",
      chunks: chunks.map(
        (chunk, index): DocumentChunk => ({
          pageContent: chunk.pageContent,
          metadata: {
            ...chunk.metadata,
            documentId,
            chunkIndex: index,
            fileName: file.name,
            fileType: "docx",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        })
      ),
      metadata: {
        fileName: file.name,
        fileType: "docx",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    return processedDoc;
  } catch (error) {
    console.error("Error processing DOCX file:", error);
    throw new Error(
      `Failed to process DOCX file: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function processTextNote(
  content: string,
  title?: string
): Promise<ProcessedDocument> {
  try {
    // Create a document from the text content
    const doc = new Document({
      pageContent: content,
      metadata: {
        source: "user_input",
        title: title || "User Note",
      },
    });

    // Split the text into chunks
    const chunks = await textSplitter.splitDocuments([doc]);

    const documentId = uuidv4();
    const processedDoc: ProcessedDocument = {
      id: documentId,
      title: title || "User Note",
      contentType: "note",
      chunks: chunks.map(
        (chunk, index): DocumentChunk => ({
          pageContent: chunk.pageContent,
          metadata: {
            ...chunk.metadata,
            documentId,
            chunkIndex: index,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        })
      ),
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    return processedDoc;
  } catch (error) {
    console.error("Error processing text note:", error);
    throw new Error(
      `Failed to process text note: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function splitDocumentIntoChunks(
  content: string,
  metadata: Record<string, any> = {}
): Promise<Document[]> {
  const doc = new Document({
    pageContent: content,
    metadata,
  });

  return await textSplitter.splitDocuments([doc]);
}

export function extractFileMetadata(file: File): Record<string, any> {
  return {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    lastModified: new Date(file.lastModified).toISOString(),
  };
}

export function validateFileType(file: File): boolean {
  return SUPPORTED_FILE_TYPES.includes(file.type as SupportedFileType);
}