import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { executeRAGQuery } from '@/lib/rag-system';

/**
 * POST /api/query
 * Execute RAG queries with context retrieval and generation
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      question, 
      includeMetadata = true,
      maxResults = 5,
      scoreThreshold = 0.7,
    } = body;

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required and must be a string' },
        { status: 400 }
      );
    }

    // Execute RAG query
    const response = await executeRAGQuery({
      question,
      userId,
      includeMetadata,
      maxResults,
      scoreThreshold,
    });

    return NextResponse.json({
      success: true,
      ...response,
    });

  } catch (error) {
    console.error('Error executing query:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute query',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/query/status
 * Check if user has any documents for querying
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Import here to avoid circular imports
    const { getVectorStore } = await import('@/lib/qdrant');
    
    // Try to get vector store and check if user has documents
    try {
      const vectorStore = await getVectorStore(userId);
      const testQuery = await vectorStore.similaritySearch("test", 1, {
        must: [
          {
            key: "metadata.userId",
            match: { value: userId }
          }
        ]
      });

      return NextResponse.json({
        hasDocuments: testQuery.length > 0,
        documentCount: testQuery.length
      });
    } catch (error) {
      // If vector store fails, assume no documents
      return NextResponse.json({
        hasDocuments: false,
        documentCount: 0
      });
    }

  } catch (error) {
    console.error('Error checking query status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
