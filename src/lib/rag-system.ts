import { ChatOpenAI } from "@langchain/openai";
import { getVectorStore } from "./qdrant";
import type { Document } from "@langchain/core/documents";

// Models
const chatModel = new ChatOpenAI({
  model: "gpt-4",
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY!,
});

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
  filter?: Record<string, any>; // 👈 add filter support
}

/**
 * RAG Response Interface
 */
export interface RAGResponse {
  answer: string;
  sources: Array<{
    content: string;
    metadata: Record<string, unknown>;
  }>;
  query: string;
  timestamp: string;
}

/**
 * Normal RAG query with optional metadata filter
 */
export async function executeRAGQuery({
  question,
  userId,
  includeMetadata = true,
  maxResults = 5,
  scoreThreshold = 0.1,
}: RAGQuery): Promise<RAGResponse> {
  try {
    const vectorStore = await getVectorStore(userId);

    const filter = {
      must: [
        {
          key: "metadata.userId",
          match: { value: userId },
        },
      ],
    };

    const retriever = vectorStore.asRetriever({
      k: maxResults,
      filter: filter, // 👈 pass filter to retriever
    });

    const relevantDocs: Document[] = await retriever.invoke(question);

    if (relevantDocs.length === 0) {
      return {
        answer:
          "I don't have any relevant information in your uploaded documents to answer this question.",
        sources: [],
        query: question,
        timestamp: new Date().toISOString(),
      };
    }

    const context = relevantDocs
      .map(
        (doc) =>
          `Content: ${doc.pageContent}\nMetadata: ${JSON.stringify(
            doc.metadata
          )}`
      )
      .join("\n\n");

    const SYSTEM_PROMPT = `
      You are an AI assistant that answers user questions strictly based on the provided context. 
      If the context does not contain the answer, say "I don’t know."

      Context:
      ${context}

      Question: ${question}
          `;

    const response = await chatModel.invoke(SYSTEM_PROMPT);

    const sources = relevantDocs.map((doc) => ({
      content: doc.pageContent.slice(0, 200) + "...",
      metadata: includeMetadata ? doc.metadata : {},
    }));

    return {
      answer: response.content as string,
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
 * Streaming RAG query with filter support
 */
export async function* executeRAGQueryStream({
  question,
  userId,
  maxResults = 5,
  filter,
}: Omit<RAGQuery, "includeMetadata" | "scoreThreshold">): AsyncGenerator<
  string,
  void,
  unknown
> {
  try {
    const vectorStore = await getVectorStore(userId);
    const retriever = vectorStore.asRetriever({
      k: maxResults,
      filter: filter || undefined, // 👈 pass filter here too
    });

    const relevantDocs: Document[] = await retriever.invoke(question);

    if (relevantDocs.length === 0) {
      yield "I don't have any relevant information in your uploaded documents to answer this question.";
      return;
    }

    const context = relevantDocs.map((doc) => doc.pageContent).join("\n\n");

    const prompt = `Answer the question using the context below. 
If you don’t know the answer from context, say "I don’t know."

Context:
${context}

Question: ${question}

Answer:`;

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
