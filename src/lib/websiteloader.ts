import { RecursiveUrlLoader } from "@langchain/community/document_loaders/web/recursive_url";
import { compile } from "html-to-text";
import { ProcessedDocument, textSplitter } from "./document-processor";
import { DocumentChunk, WebsiteProcessingOptions } from "@/types";
import { v4 as uuidv4 } from "uuid";

export async function processWebsiteURL(
  url: string,
  title?: string,
  options: WebsiteProcessingOptions = {}
): Promise<ProcessedDocument> {
  try {
    // Validate URL format
    const urlObj = new URL(url);
    
    const {
      maxDepth = 2, // Crawl deeper to get more pages
      excludeDirs = ["/docs/api/", "/admin/", "/login/", "/register/"],
      maxPages = 50, // Limit to prevent infinite crawling
      sameDomainOnly = true
    } = options;

    console.log(`Starting recursive crawl of ${url} with maxDepth: ${maxDepth}`);

    // Configure HTML to text conversion with basic, reliable settings
    const compiledConvert = compile({
      wordwrap: 130,
      preserveNewlines: true,
      // Basic selectors that are well supported
      selectors: [
        { selector: 'script', format: 'skip' },
        { selector: 'style', format: 'skip' },
        { selector: 'nav', format: 'skip' },
        { selector: 'header', format: 'skip' },
        { selector: 'footer', format: 'skip' },
      ]
    });

    // Use LangChain RecursiveUrlLoader for comprehensive web scraping
    const loader = new RecursiveUrlLoader(url, {
      extractor: compiledConvert,
      maxDepth,
      excludeDirs,
      timeout: 10000, // 10 second timeout per page
      // Filter function to control which URLs to crawl
      preventOutside: sameDomainOnly,
    });

    console.log("Loading documents from website...");
    const docs = await loader.load();
    console.log(`Loaded ${docs.length} pages from website`);

    if (docs.length === 0) {
      throw new Error("No content could be extracted from the URL");
    }

    // Limit the number of pages if specified
    const limitedDocs = maxPages ? docs.slice(0, maxPages) : docs;

    // Process each page as a separate document with URL-based indexing
    const allChunks: DocumentChunk[] = [];
    const baseDocumentId = uuidv4();

    for (let docIndex = 0; docIndex < limitedDocs.length; docIndex++) {
      const doc = limitedDocs[docIndex];
      const pageUrl = doc.metadata.source || url;
      
      // Create a clean title for each page
      const pageTitle = generatePageTitle(pageUrl, urlObj.hostname);
      
      console.log(`Processing page ${docIndex + 1}/${limitedDocs.length}: ${pageUrl}`);

      // Split each page into chunks
      const pageChunks = await textSplitter.splitDocuments([doc]);

      // Add chunks with URL-specific metadata
      for (let chunkIndex = 0; chunkIndex < pageChunks.length; chunkIndex++) {
        const chunk = pageChunks[chunkIndex];
        const chunkId = uuidv4();
        
        allChunks.push({
          pageContent: chunk.pageContent,
          metadata: {
            ...chunk.metadata,
            documentId: baseDocumentId,
            chunkId,
            chunkIndex: allChunks.length, // Global chunk index
            pageIndex: docIndex, // Which page this chunk belongs to
            pageChunkIndex: chunkIndex, // Chunk index within the page
            url: pageUrl, // Specific page URL
            baseUrl: url, // Original requested URL
            pageTitle,
            hostname: urlObj.hostname,
            path: new URL(pageUrl).pathname,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
      }
    }

    console.log(`Created ${allChunks.length} chunks from ${limitedDocs.length} pages`);

    const processedDoc: ProcessedDocument = {
      id: baseDocumentId,
      title: title || `Website: ${urlObj.hostname}`,
      contentType: "url",
      chunks: allChunks,
      metadata: {
        url,
        hostname: urlObj.hostname,
        totalPages: limitedDocs.length,
        totalChunks: allChunks.length,
        crawlDepth: maxDepth,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Store all crawled URLs for reference
        crawledUrls: limitedDocs.map(doc => doc.metadata.source || url),
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

/**
 * Generate a meaningful title for each page based on its URL
 */
function generatePageTitle(pageUrl: string, hostname: string): string {
  try {
    const url = new URL(pageUrl);
    const path = url.pathname;
    
    // Handle root path
    if (path === '/' || path === '') {
      return `${hostname} - Home`;
    }
    
    // Convert path to readable title
    const pathSegments = path.split('/').filter(segment => segment.length > 0);
    const lastSegment = pathSegments[pathSegments.length - 1];
    
    // Clean up the path segment
    const cleanTitle = lastSegment
      .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
      .replace(/\.(html|htm|php|asp|aspx)$/i, '') // Remove file extensions
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Title case
      .join(' ');
    
    return `${hostname} - ${cleanTitle}`;
  } catch (error) {
    return `${hostname} - Page`;
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
