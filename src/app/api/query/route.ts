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
      apiKey,
      model,
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

    // API key is now optional - will fall back to environment variable
    if (apiKey && typeof apiKey !== 'string') {
      return NextResponse.json(
        { error: 'API key must be a string if provided' },
        { status: 400 }
      );
    }

    // Execute RAG query with user's API key and model
    const response = await executeRAGQuery({
      question,
      userId,
      apiKey,
      model,
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
    const { qdrantClient, COLLECTION_NAME } = await import('@/lib/qdrant');
    
    // Try to check if user has documents without requiring embeddings
    try {
      const scrollResult = await qdrantClient.scroll(COLLECTION_NAME, {
        filter: {
          must: [
            {
              key: "metadata.userId",
              match: { value: userId }
            }
          ]
        },
        limit: 1,
        with_payload: false,
        with_vector: false
      });

      return NextResponse.json({
        hasDocuments: scrollResult.points.length > 0,
        documentCount: scrollResult.points.length
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
