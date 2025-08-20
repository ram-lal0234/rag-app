import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getVectorStore } from "@/lib/qdrant";
import {
  DocumentListResponse,
  APIErrorResponse,
  DocumentListItem,
} from "@/types";

/**
 * GET /api/documents
 * List user's documents with metadata
 * Following README API structure for document management
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<DocumentListResponse | APIErrorResponse>> {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const contentType = searchParams.get("contentType") as
      | "note"
      | "document"
      | "url"
      | null;

    console.log(
      `User ID: ${userId}, Limit: ${limit}, Offset: ${offset}, Content Type: ${contentType}`
    );

    // Get vector store with user filtering
    const vectorStore = await getVectorStore(userId);

    console.log(
      `Listing documents for user ${userId} with limit ${limit} and offset ${offset}`
    );

    // Build filter for search
    const filter: any = {
      must: [
        {
          key: "metadata.userId",
          match: { value: userId },
        },
      ],
    };

    // Add content type filter if specified
    if (contentType) {
      filter.must.push({
        key: "metadata.contentType",
        match: { value: contentType },
      });
    }

    console.log("Using filter:", JSON.stringify(filter, null, 2));

    // Search for documents (we'll use a broad search to get all user documents)
    let searchResults: any[] = [];
    try {
      // First try with filter
      searchResults = await vectorStore.similaritySearch(
        "", // Empty query to get all documents
        limit + offset, // Get more than needed for pagination
        filter
      );
      console.log(`Found ${searchResults.length} documents with filter`);
    } catch (searchError) {
      console.error("Similarity search error:", searchError);
      console.error("Error details:", JSON.stringify(searchError, null, 2));
      
      // If the error is about missing index, try without filter first
      if (searchError instanceof Error && searchError.message?.includes("Index required but not found")) {
        console.log("Trying search without filter due to missing index...");
        try {
          searchResults = await vectorStore.similaritySearch(
            "", // Empty query to get all documents
            limit + offset, // Get more than needed for pagination
          );
          
          // Filter results manually in memory
          searchResults = searchResults.filter((doc: any) => 
            doc.metadata?.userId === userId
          );
          
          console.log(`Found ${searchResults.length} documents after manual filtering`);
        } catch (fallbackError) {
          console.error("Fallback search also failed:", fallbackError);
          // Return empty results instead of throwing error
          searchResults = [];
        }
      } else {
        // Return empty results instead of throwing error
        searchResults = [];
      }
    }

    console.log(`Found ${searchResults.length} documents for user ${userId}`);

    // Group chunks by documentId to get unique documents
    const documentMap = new Map<string, DocumentListItem>();

    for (const doc of searchResults) {
      const metadata = doc.metadata;
      const documentId = metadata.documentId;

      if (!documentId) continue;

      if (!documentMap.has(documentId)) {
        // Extract document info from the first chunk
        const docItem: DocumentListItem = {
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
          chunksCount: 1,
          url: metadata.url,
        };

        documentMap.set(documentId, docItem);
      } else {
        // Increment chunk count for existing document
        const existingDoc = documentMap.get(documentId)!;
        existingDoc.chunksCount++;
      }
    }

    // Convert map to array and apply pagination
    const allDocuments = Array.from(documentMap.values());
    const paginatedDocuments = allDocuments.slice(offset, offset + limit);

    // Sort by creation date (newest first)
    paginatedDocuments.sort(
      (a, b) =>
        new Date(b.metadata.createdAt).getTime() -
        new Date(a.metadata.createdAt).getTime()
    );

    const response: DocumentListResponse = {
      success: true,
      documents: paginatedDocuments,
      totalCount: allDocuments.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error listing documents:", error);
    return NextResponse.json(
      {
        error: "Failed to list documents",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
