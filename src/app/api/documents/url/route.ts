import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { processWebsiteURL, validateAndCleanURL } from "@/lib/websiteloader";
import { createVectorStoreFromDocuments } from "@/lib/qdrant";
import {
  DocumentResponse,
  APIErrorResponse,
  ProcessUrlRequest,
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

    const body: ProcessUrlRequest = await request.json();
    const { url, title, tags } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required and must be a string" },
        { status: 400 }
      );
    }

    if (url.trim().length === 0) {
      return NextResponse.json(
        { error: "URL cannot be empty" },
        { status: 400 }
      );
    }

    // Validate and clean URL
    let cleanedUrl: string;
    try {
      cleanedUrl = validateAndCleanURL(url);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid URL format provided" },
        { status: 400 }
      );
    }

    // Process the website URL using LangChain CheerioWebBaseLoader
    const processedDocument = await processWebsiteURL(cleanedUrl, title);

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

    // Store document chunks in Qdrant vector database
    await createVectorStoreFromDocuments(processedDocument.chunks, userId);

    // Return success response matching DocumentResponse interface
    const response: DocumentResponse = {
      success: true,
      documentId: processedDocument.id,
      title: processedDocument.title,
      contentType: processedDocument.contentType,
      chunksCount: processedDocument.chunks.length,
      url: cleanedUrl,
      metadata: processedDocument.metadata,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error processing URL:", error);
    return NextResponse.json(
      {
        error: "Failed to process website URL",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
