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
    const { getVectorStore } = await import("@/lib/qdrant");

    // Get vector store with user filtering
    const vectorStore = await getVectorStore(userId);

    // Search for document chunks
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

    const searchResults = await vectorStore.similaritySearch(
      "", // Empty query to get all chunks
      100, // Get up to 100 chunks
      filter
    );

    if (searchResults.length === 0) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Extract document metadata from the first chunk
    const firstChunk = searchResults[0];
    const metadata = firstChunk.metadata;

    const documentDetails = {
      id: documentId,
      title: metadata.title || "Untitled Document",
      contentType: metadata.contentType || "document",
      metadata: {
        fileName: metadata.fileName,
        fileType: metadata.fileType,
        url: metadata.url,
        createdAt: metadata.createdAt || new Date().toISOString(),
        updatedAt: metadata.updatedAt || new Date().toISOString(),
        tags: metadata.tags,
      },
      chunksCount: searchResults.length,
      url: metadata.url,
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
