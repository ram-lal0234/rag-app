import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  processPDFFile,
  processTextNote,
  processDocxFile,
  validateFileType,
} from "@/lib/document-processor";
import { createVectorStoreFromDocuments } from "@/lib/qdrant";
import {
  DocumentResponse,
  APIErrorResponse,
  type DocumentChunk,
} from "@/types";

/**
 * POST /api/documents/upload
 * Handle document uploads and process them into vector embeddings
 * Following README API structure for document management
 * Supports: PDF, TXT, MD, DOCX files
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<DocumentResponse | APIErrorResponse>> {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const tagsString = formData.get("tags") as string;
    const apiKey = formData.get("apiKey") as string;

    // Parse tags if provided
    const tags = tagsString
      ? tagsString
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : undefined;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // API key is now optional - will fall back to environment variable
    if (apiKey && typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "API key must be a string if provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!validateFileType(file)) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Please upload PDF, TXT, MD, or DOCX files.",
        },
        { status: 400 }
      );
    }

    // Process the document based on file type
    let processedDocument;

    if (file.type === "application/pdf") {
      processedDocument = await processPDFFile(file, file.name);
    } else if (file.type === "text/plain" || file.type === "text/markdown") {
      const text = await file.text();
      processedDocument = await processTextNote(text, file.name);
    } else if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      processedDocument = await processDocxFile(file, file.name);
    } else {
      return NextResponse.json(
        { error: "Unsupported file type for processing" },
        { status: 400 }
      );
    }

    // Add tags to metadata if provided
    if (tags) {
      processedDocument.metadata.tags = tags;
      processedDocument.chunks = processedDocument.chunks.map(
        (chunk: DocumentChunk): DocumentChunk => ({
          ...chunk,
          metadata: {
            ...chunk.metadata,
            tags,
          },
        })
      );
    }

    // Store document chunks in Qdrant vector database with user's API key
    await createVectorStoreFromDocuments(processedDocument.chunks, userId, apiKey);

    // Return success response matching DocumentResponse interface
    const response: DocumentResponse = {
      success: true,
      documentId: processedDocument.id,
      title: processedDocument.title,
      contentType: processedDocument.contentType,
      chunksCount: processedDocument.chunks.length,
      metadata: processedDocument.metadata,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error processing upload:", error);
    return NextResponse.json(
      {
        error: "Failed to process document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
