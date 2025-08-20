import { ChatOpenAI } from "@langchain/openai";
import { getVectorStore } from "./qdrant";
import type { Document } from "@langchain/core/documents";

// Create chat model with dynamic API key and model
const createChatModel = (apiKey?: string, model?: string) => {
  if (!apiKey) {
    throw new Error("OpenAI API key is required");
  }
  return new ChatOpenAI({
    model: model || "gpt-4o-mini",
    temperature: 0.7,
    openAIApiKey: apiKey,
  });
};

const createStreamingChatModel = (apiKey?: string, model?: string) => {
  if (!apiKey) {
    throw new Error("OpenAI API key is required");
  }
  return new ChatOpenAI({
    model: model || "gpt-4o-mini",
    temperature: 0.7,
    streaming: true,
    openAIApiKey: apiKey,
  });
};

/**
 * RAG Query Interface
 */
export interface RAGQuery {
  question: string;
  userId: string;
  apiKey: string; // User's OpenAI API key (required)
  model?: string; // OpenAI model to use
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
  apiKey,
  model,
  includeMetadata = true,
  maxResults = 3,
  scoreThreshold = 0.7,
}: RAGQuery): Promise<RAGResponse> {
  if (!apiKey) {
    throw new Error("OpenAI API key is required");
  }
  try {
    const vectorStore = await getVectorStore(userId, apiKey);

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

    // Filter documents based on score threshold if they have scores
    const filteredDocs = relevantDocs.filter((doc: any) => {
      // If document has a score and it's below threshold, filter it out
      if (doc.score !== undefined && doc.score < scoreThreshold) {
        return false;
      }
      return true;
    });

    if (filteredDocs.length === 0) {
      return {
        answer:
          "I don't have any relevant information in your uploaded documents to answer this question. Please ask questions related to the documents, notes, or websites you've added to your knowledge base.",
        sources: [],
        query: question,
        timestamp: new Date().toISOString(),
      };
    }

    const context = filteredDocs
      .map(
        (doc) =>
          `Content: ${doc.pageContent}\nMetadata: ${JSON.stringify(
            doc.metadata
          )}`
      )
      .join("\n\n");

    const SYSTEM_PROMPT = `
      You are an AI assistant that answers user questions strictly based on the provided context. 
      
      IMPORTANT RULES:
      1. Only answer if the context contains relevant information to answer the question
      2. If the context doesn't contain enough information to answer the question, respond with: "I don't have enough information in your uploaded documents to answer this question. Please ask questions related to the documents, notes, or websites you've added to your knowledge base."
      3. Do not make up information or use external knowledge
      4. Be concise and accurate in your responses

      Context:
      ${context}

      Question: ${question}
          `;

    const chatModel = createChatModel(apiKey, model);
    const response = await chatModel.invoke(SYSTEM_PROMPT);

    // Only include sources if the answer is actually based on the context
    const answer = response.content as string;
    const shouldIncludeSources = !answer.toLowerCase().includes("don't have enough information") && 
                                !answer.toLowerCase().includes("don't know") &&
                                filteredDocs.length > 0;

    const sources = shouldIncludeSources ? filteredDocs.map((doc) => ({
      content: doc.pageContent.slice(0, 200) + "...",
      metadata: includeMetadata ? doc.metadata : {},
    })) : [];

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
  apiKey,
  model,
  maxResults = 3,
  filter,
}: Omit<RAGQuery, "includeMetadata" | "scoreThreshold">): AsyncGenerator<
  string,
  void,
  unknown
> {
  if (!apiKey) {
    throw new Error("OpenAI API key is required");
  }
  try {
    const vectorStore = await getVectorStore(userId, apiKey);
    const retriever = vectorStore.asRetriever({
      k: maxResults,
      filter: filter || undefined, // 👈 pass filter here too
    });

    const relevantDocs: Document[] = await retriever.invoke(question);

    // Filter documents based on score threshold if they have scores
    const filteredDocs = relevantDocs.filter((doc: any) => {
      // If document has a score and it's below threshold, filter it out
      if (doc.score !== undefined && doc.score < 0.7) { // Use 0.7 as default for streaming
        return false;
      }
      return true;
    });

    if (filteredDocs.length === 0) {
      yield "I don't have any relevant information in your uploaded documents to answer this question. Please ask questions related to the documents, notes, or websites you've added to your knowledge base.";
      return;
    }

    const context = filteredDocs.map((doc) => doc.pageContent).join("\n\n");

    const prompt = `Answer the question using the context below. 
        
        IMPORTANT RULES:
        1. Only answer if the context contains relevant information to answer the question
        2. If the context doesn't contain enough information to answer the question, say: "I don't have enough information in your uploaded documents to answer this question. Please ask questions related to the documents, notes, or websites you've added to your knowledge base."
        3. Do not make up information or use external knowledge
        4. Be concise and accurate in your responses

        Context:
        ${context}

        Question: ${question}

        Answer:`;

    const streamingChatModel = createStreamingChatModel(apiKey, model);
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
