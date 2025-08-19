import { ChatOpenAI } from "@langchain/openai";
import { getVectorStore } from "./qdrant";

// Initialize OpenAI Chat Model
const chatModel = new ChatOpenAI({
  model: "gpt-4",
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY!,
});

// Streaming chat model
const streamingChatModel = new ChatOpenAI({
  model: "gpt-4",
  temperature: 0.7,
  streaming: true,
  openAIApiKey: process.env.OPENAI_API_KEY!,
});

/**
 * RAG Query Interface
 */
export interface RAGQuery {
  question: string;
  userId: string;
  includeMetadata?: boolean;
  maxResults?: number;
  scoreThreshold?: number;
}

/**
 * RAG Response Interface
 */
export interface RAGResponse {
  answer: string;
  sources: Array<{
    content: string;
    metadata: Record<string, unknown>;
    score?: number;
  }>;
  query: string;
  timestamp: string;
}

/**
 * Simple RAG query - returns formatted response
 */
export async function executeRAGQuery({
  question,
  userId,
  includeMetadata = true,
  maxResults = 5,
  scoreThreshold = 0.7,
}: RAGQuery): Promise<RAGResponse> {
  try {
    // Get vector store
    const vectorStore = await getVectorStore(userId);

    // Get relevant documents
    const relevantDocs = await vectorStore.similaritySearchWithScore(
      question,
      maxResults * 2, // Get more for filtering
      {
        must: [
          {
            key: "metadata.userId",
            match: { value: userId },
          },
        ],
      }
    );

    // Filter by score threshold
    const filteredDocs = relevantDocs
      .filter(([, score]) => score >= scoreThreshold)
      .slice(0, maxResults);

    if (filteredDocs.length === 0) {
      return {
        answer:
          "I don't have any relevant information in your uploaded documents to answer this question.",
        sources: [],
        query: question,
        timestamp: new Date().toISOString(),
      };
    }

    // Format context
    const context = filteredDocs.map(([doc]) => doc.pageContent).join("\n\n");

    // Simple prompt
    const prompt = `Use this context to answer the question. If you don't know, say so.

Context:
${context}

Question: ${question}

Answer:`;

    // Get response from OpenAI
    const response = await chatModel.invoke(prompt);
    const answer = response.content as string;

    // Format sources
    const sources = filteredDocs.map(([doc, score]) => ({
      content: doc.pageContent.substring(0, 200) + "...",
      metadata: includeMetadata ? doc.metadata : {},
      score: Math.round(score * 1000) / 1000,
    }));

    return {
      answer,
      sources,
      query: question,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error executing RAG query:", error);
    throw new Error(
      `RAG query failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Streaming RAG query - yields chunks
 */
export async function* executeRAGQueryStream({
  question,
  userId,
  maxResults = 5,
}: Omit<RAGQuery, "includeMetadata" | "scoreThreshold">): AsyncGenerator<
  string,
  void,
  unknown
> {
  try {
    // Get vector store
    const vectorStore = await getVectorStore(userId);

    // Get relevant documents
    const relevantDocs = await vectorStore.similaritySearchWithScore(
      question,
      maxResults,
      {
        must: [
          {
            key: "metadata.userId",
            match: { value: userId },
          },
        ],
      }
    );

    if (relevantDocs.length === 0) {
      yield "I don't have any relevant information in your uploaded documents to answer this question.";
      return;
    }

    // Format context
    const context = relevantDocs.map(([doc]) => doc.pageContent).join("\n\n");

    // Simple prompt
    const prompt = `Use this context to answer the question. If you don't know, say so.

Context:
${context}

Question: ${question}

Answer:`;

    // Stream response
    const stream = await streamingChatModel.stream(prompt);

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content as string;
      }
    }
  } catch (error) {
    console.error("Error executing streaming RAG query:", error);
    yield `Error: ${
      error instanceof Error ? error.message : "Unknown error occurred"
    }`;
  }
}
