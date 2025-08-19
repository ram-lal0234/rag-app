import { RecursiveUrlLoader } from "@langchain/community/document_loaders/web/recursive_url";
import { compile } from "html-to-text";
import { ProcessedDocument, textSplitter } from "./document-processor";
import { DocumentChunk } from "@/types";
import { v4 as uuidv4 } from "uuid";

export async function processWebsiteURL(
  url: string,
  title?: string
): Promise<ProcessedDocument> {
  try {
    // Validate URL format
    new URL(url); // This will throw if URL is invalid

    const compiledConvert = compile({ wordwrap: 130 }); // returns (text: string) => string;

    // Use LangChain CheerioWebBaseLoader for web scraping
    const loader = new RecursiveUrlLoader(url, {
      extractor: compiledConvert,
      maxDepth: 1,
      excludeDirs: ["/docs/api/"],
    });

    const docs = await loader.load();

    if (docs.length === 0) {
      throw new Error("No content could be extracted from the URL");
    }

    // Split documents into chunks
    const chunks = await textSplitter.splitDocuments(docs);

    const documentId = uuidv4();
    const processedDoc: ProcessedDocument = {
      id: documentId,
      title: title || `Website: ${new URL(url).hostname}`,
      contentType: "url",
      chunks: chunks.map(
        (chunk, index): DocumentChunk => ({
          pageContent: chunk.pageContent,
          metadata: {
            ...chunk.metadata,
            documentId,
            chunkIndex: index,
            url,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        })
      ),
      metadata: {
        url,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    return processedDoc;
  } catch (error) {
    console.error("Error processing website URL:", error);
    if (error instanceof TypeError) {
      throw new Error("Invalid URL format provided");
    }
    throw new Error(
      `Failed to process website URL: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export function validateAndCleanURL(url: string): string {
  try {
    // Add protocol if missing
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    const urlObj = new URL(url);
    return urlObj.toString();
  } catch (error) {
    throw new Error("Invalid URL format");
  }
}
