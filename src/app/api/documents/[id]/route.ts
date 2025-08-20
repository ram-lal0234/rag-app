import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { deleteUserDocuments } from "@/lib/qdrant";
import { DeleteDocumentResponse, APIErrorResponse } from "@/types";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<DeleteDocumentResponse | APIErrorResponse>> {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: documentId } = await params;

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Validate document ID format (should be UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(documentId)) {
      return NextResponse.json(
        { error: "Invalid document ID format" },
        { status: 400 }
      );
    }

    // Delete the document and all its chunks from Qdrant
    await deleteUserDocuments(userId, documentId);

    const response: DeleteDocumentResponse = {
      success: true,
      deletedDocumentId: documentId,
      message:
        "Document and all associated vectors have been successfully deleted",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      {
        error: "Failed to delete document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: documentId } = await params;

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Import here to avoid circular imports
    const { qdrantClient, COLLECTION_NAME } = await import("@/lib/qdrant");

    // Search for document chunks using Qdrant client directly
    const filter = {
      must: [
        {
          key: "metadata.userId",
          match: { value: userId },
        },
        {
          key: "metadata.documentId",
          match: { value: documentId },
        },
      ],
    };

    const scrollResult = await qdrantClient.scroll(COLLECTION_NAME, {
      filter: filter,
      limit: 100, // Get up to 100 chunks
      with_payload: true,
      with_vector: false, // We don't need vectors for document details
    });

    // Convert Qdrant points to the expected format
    const searchResults = scrollResult.points.map(point => ({
      metadata: point.payload?.metadata || point.payload,
      pageContent: point.payload?.pageContent || '',
    }));

    if (searchResults.length === 0) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Extract document metadata from the first chunk
    const firstChunk = searchResults[0];
    const metadata = firstChunk.metadata || {};

    const documentDetails = {
      id: documentId,
      title: (metadata as any).title || "Untitled Document",
      contentType: (metadata as any).contentType || "document",
      metadata: {
        fileName: (metadata as any).fileName,
        fileType: (metadata as any).fileType,
        url: (metadata as any).url,
        createdAt: (metadata as any).createdAt || new Date().toISOString(),
        updatedAt: (metadata as any).updatedAt || new Date().toISOString(),
        tags: (metadata as any).tags,
      },
      chunksCount: searchResults.length,
      url: (metadata as any).url,
      chunks: searchResults.map((chunk) => ({
        content: chunk.pageContent,
        metadata: chunk.metadata,
      })),
    };

    return NextResponse.json({
      success: true,
      document: documentDetails,
    });
  } catch (error) {
    console.error("Error getting document:", error);
    return NextResponse.json(
      {
        error: "Failed to get document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
