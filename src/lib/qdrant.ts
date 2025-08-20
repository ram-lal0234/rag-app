import { QdrantClient } from "@qdrant/js-client-rest";
import { QdrantVectorStore } from "@langchain/qdrant";
import { OpenAIEmbeddings } from "@langchain/openai";

// Configuration constants
export const COLLECTION_NAME = "user_documents";
export const VECTOR_SIZE = 1536; // for text-embedding-3-small

// Initialize Qdrant client
export const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL!,
  apiKey: process.env.QDRANT_API_KEY,
});

// Initialize embeddings
export const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
  openAIApiKey: process.env.OPENAI_API_KEY!,
});

// Initialize collection if it doesn't exist
export async function initializeCollection() {
  try {
    const collections = await qdrantClient.getCollections();
    const collectionExists = collections.collections.some(
      (collection: any) => collection.name === COLLECTION_NAME
    );

    if (!collectionExists) {
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: "Cosine",
        },
        optimizers_config: {
          default_segment_number: 2,
        },
        replication_factor: 1,
      });
      console.log(`Collection ${COLLECTION_NAME} created successfully`);
    }

    // Create indexes for filtering fields
    try {
      await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
        field_name: "metadata.userId",
        field_schema: "keyword",
      });
      console.log("Created index for metadata.userId");
    } catch (indexError: any) {
      // Index might already exist, which is fine
      if (!indexError.message?.includes("already exists")) {
        console.error("Error creating userId index:", indexError);
      }
    }

    try {
      await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
        field_name: "metadata.contentType",
        field_schema: "keyword",
      });
      console.log("Created index for metadata.contentType");
    } catch (indexError: any) {
      // Index might already exist, which is fine
      if (!indexError.message?.includes("already exists")) {
        console.error("Error creating contentType index:", indexError);
      }
    }

    try {
      await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
        field_name: "metadata.documentId",
        field_schema: "keyword",
      });
      console.log("Created index for metadata.documentId");
    } catch (indexError: any) {
      // Index might already exist, which is fine
      if (!indexError.message?.includes("already exists")) {
        console.error("Error creating documentId index:", indexError);
      }
    }
  } catch (error) {
    console.error("Error initializing collection:", error);
    throw error;
  }
}

// Get vector store instance with user filtering
export async function getVectorStore(userId?: string) {
  await initializeCollection();

  return new QdrantVectorStore(embeddings, {
    client: qdrantClient,
    collectionName: COLLECTION_NAME,
    url: process.env.QDRANT_URL!,
    apiKey: process.env.QDRANT_API_KEY,
    ...(userId && {
      filter: {
        must: [
          {
            key: "metadata.userId",
            match: { value: userId },
          },
        ],
      },
    }),
  });
}

// Create vector store from documents with user metadata
export async function createVectorStoreFromDocuments(
  documents: any[],
  userId: string
) {
  await initializeCollection();

  // Add userId to all documents
  const documentsWithUserId = documents.map((doc) => ({
    ...doc,
    metadata: {
      ...doc.metadata,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  }));

  return await QdrantVectorStore.fromDocuments(
    documentsWithUserId,
    embeddings,
    {
      client: qdrantClient,
      collectionName: COLLECTION_NAME,
      url: process.env.QDRANT_URL!,
      apiKey: process.env.QDRANT_API_KEY,
    }
  );
}

// Delete documents by user ID
export async function deleteUserDocuments(userId: string, documentId?: string) {
  try {
    const filter = documentId
      ? {
          must: [
            { key: "metadata.userId", match: { value: userId } },
            { key: "metadata.documentId", match: { value: documentId } },
          ],
        }
      : {
          must: [{ key: "metadata.userId", match: { value: userId } }],
        };

    await qdrantClient.delete(COLLECTION_NAME, {
      filter,
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting documents:", error);
    throw error;
  }
}
