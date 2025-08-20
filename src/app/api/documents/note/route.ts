import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { processTextNote } from "@/lib/document-processor";
import { createVectorStoreFromDocuments } from "@/lib/qdrant";
import {
  DocumentResponse,
  APIErrorResponse,
  CreateNoteRequest,
  type DocumentChunk,
} from "@/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<DocumentResponse | APIErrorResponse>> {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateNoteRequest = await request.json();
    const { content, title, tags, apiKey } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Content is required and must be a string" },
        { status: 400 }
      );
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content cannot be empty" },
        { status: 400 }
      );
    }

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "OpenAI API key is required" },
        { status: 400 }
      );
    }

    // Process the text note
    const processedDocument = await processTextNote(content, title);

    // Add tags to metadata if provided
    if (tags && tags.length > 0) {
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
    console.error("Error processing note:", error);
    return NextResponse.json(
      {
        error: "Failed to process note",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
