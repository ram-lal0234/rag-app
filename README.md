# RAG Application Implementation with Qdrant, LangChain, and Next.js

## Project Overview
Create a complete RAG (Retrieval-Augmented Generation) application that allows users to upload documents, add notes, submit website URLs, and query the stored information. The system should use Qdrant as the vector database, LangChain for orchestration, OpenAI for embeddings and chat completions, and Next.js for the full-stack implementation.

## Core Requirements

### 1. Tech Stack
- **Frontend & Backend**: Next.js 14+ with App Router
- **Vector Database**: Qdrant (cloud or self-hosted)
- **Embeddings**: OpenAI text-embedding-3-small or text-embedding-3-large
- **LLM**: OpenAI GPT-4 or GPT-3.5-turbo
- **Orchestration**: LangChain
- **Authentication**: NextAuth.js or Clerk
- **File Upload**: Support PDF, TXT, DOCX, MD files
- **Web Scraping**: Cheerio or Puppeteer for URL content extraction

### 2. Database Schema (Qdrant Collections)
```typescript
// Qdrant Point Structure
interface DocumentPoint {
  id: string;
  vector: number[]; // OpenAI embedding
  payload: {
    userId: string;
    documentId: string;
    contentType: 'note' | 'document' | 'url';
    title: string;
    content: string;
    chunk: string;
    chunkIndex: number;
    metadata: {
      fileName?: string;
      fileType?: string;
      url?: string;
      createdAt: string;
      updatedAt: string;
      tags?: string[];
    };
  };
}
```

### 3. API Endpoints Structure

#### Document Management APIs
```
POST /api/documents/upload - Upload and process documents
POST /api/documents/note - Add text notes
POST /api/documents/url - Process website URLs
GET /api/documents - List user's documents
DELETE /api/documents/[id] - Delete document and vectors
```

#### Query API
```
POST /api/query - RAG query with context retrieval
```

### 4. Core Features to Implement

#### A. Document Processing Pipeline
1. **File Upload Handler**
   - Accept PDF, TXT, DOCX, MD files
   - Extract text content using appropriate parsers
   - Implement chunking strategy (recursive character text splitter)
   - Generate embeddings for each chunk
   - Store in Qdrant with user metadata

2. **Note Processing**
   - Accept plain text notes with titles
   - Chunk if necessary for large notes
   - Generate embeddings and store

3. **URL Processing**
   - Fetch and extract content from web pages
   - Clean and parse HTML content
   - Extract main text content
   - Chunk and embed the content

#### B. Vector Storage (Qdrant Integration)
1. **Collection Setup**
   - Create collection with appropriate vector dimensions
   - Configure distance metric (cosine similarity)
   - Set up indexing for efficient retrieval

2. **CRUD Operations**
   - Insert document vectors with user-specific metadata
   - Update existing documents
   - Delete user documents
   - Query vectors with user filtering

#### C. RAG Query System
1. **Retrieval**
   - Convert user query to embedding
   - Search Qdrant with user filter
   - Retrieve top-k relevant chunks
   - Re-rank results if needed

2. **Generation**
   - Use LangChain to orchestrate RAG pipeline
   - Format retrieved context for LLM
   - Generate response using OpenAI chat completion
   - Include source citations

### 5. Implementation Guidelines

#### Environment Variables
```env
OPENAI_API_KEY=your_openai_key
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_key
NEXTAUTH_SECRET=your_auth_secret
NEXTAUTH_URL=http://localhost:3000
```

#### Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── documents/
│   │   │   ├── upload/route.ts
│   │   │   ├── note/route.ts
│   │   │   ├── url/route.ts
│   │   │   └── [id]/route.ts
│   │   ├── query/route.ts
│   │   └── auth/[...nextauth]/route.ts
│   ├── dashboard/
│   │   └── page.tsx
│   └── page.tsx
├── lib/
│   ├── qdrant.ts
│   ├── langchain.ts
│   ├── embeddings.ts
│   ├── document-processor.ts
│   └── auth.ts
├── components/
│   ├── FileUpload.tsx
│   ├── NoteForm.tsx
│   ├── URLForm.tsx
│   ├── QueryInterface.tsx
│   └── DocumentList.tsx
└── types/
    └── index.ts
```

### 6. Specific Implementation Tasks

#### Task 1: Qdrant Setup and Connection
- Initialize Qdrant client
- Create collection with proper configuration
- Implement connection testing
- Add error handling and retry logic

#### Task 2: Document Processing Pipeline
- Implement file upload with Next.js API routes
- Create text extraction for different file types
- Implement chunking strategy using LangChain
- Generate OpenAI embeddings for chunks
- Store in Qdrant with user metadata

#### Task 3: RAG Query Implementation
- Create embedding generation for user queries
- Implement similarity search with user filtering
- Build context formatting for LLM
- Integrate OpenAI chat completion
- Add response streaming if needed

#### Task 4: Frontend Components
- Build responsive upload interface
- Create query chat interface
- Implement document management dashboard
- Add loading states and error handling
- Include source citations in responses

#### Task 5: Authentication & Security
- Implement user authentication
- Add middleware for protected routes
- Ensure user data isolation
- Validate file uploads and content

### 7. Advanced Features to Consider
- **Hybrid Search**: Combine vector and keyword search
- **Conversation Memory**: Store chat history per user
- **Advanced Chunking**: Smart chunking based on document structure
- **Metadata Filtering**: Allow filtering by document type, date, tags
- **Export Functionality**: Export conversations and documents
- **Real-time Updates**: WebSocket for live query responses

### 8. Performance Optimizations
- Implement embedding caching
- Use streaming for large file processing
- Add pagination for document lists
- Optimize Qdrant queries with proper indexing
- Implement rate limiting for API endpoints

### 9. Error Handling & Monitoring
- Comprehensive error handling for all APIs
- Logging for debugging and monitoring
- User-friendly error messages
- Fallback mechanisms for service failures

### 10. Testing Strategy
- Unit tests for core functions
- Integration tests for API endpoints
- End-to-end tests for user workflows
- Performance testing for large documents

## Specific Code Requirements

### Qdrant Configuration
```typescript
// lib/qdrant.ts
import { QdrantClient } from '@qdrant/qdrant-js';

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

// Collection setup with user filtering
const COLLECTION_NAME = 'user_documents';
const VECTOR_SIZE = 1536; // for text-embedding-3-small
```

### LangChain Integration
```typescript
// lib/langchain.ts
import { OpenAIEmbeddings } from '@langchain/openai';
import { ChatOpenAI } from '@langchain/openai';
import { QdrantVectorStore } from '@langchain/community/vectorstores/qdrant';

// Configure embeddings and chat model
const embeddings = new OpenAIEmbeddings({
  model: 'text-embedding-3-small',
});

const chatModel = new ChatOpenAI({
  model: 'gpt-4',
  temperature: 0.7,
});
```

### Authentication Middleware
```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/auth/signin',
  },
});

export const config = {
  matcher: ['/dashboard/:path*', '/api/documents/:path*', '/api/query/:path*'],
};
```

## Development Priorities
1. Set up basic Next.js app with authentication
2. Implement Qdrant connection and collection setup
3. Create document upload and processing pipeline
4. Build RAG query system with LangChain
5. Develop frontend components
6. Add error handling and optimizations
7. Implement advanced features and testing

## Success Criteria
- Users can successfully upload documents, add notes, and submit URLs
- All content is properly chunked, embedded, and stored in Qdrant
- Query system returns relevant results with proper user filtering
- Responses include accurate source citations
- Application handles errors gracefully
- Performance is acceptable for typical use cases (sub-3s response times)
- User data is properly isolated and secure

Please implement this RAG application step by step, ensuring each component is thoroughly tested before moving to the next. Focus on creating a production-ready application with proper error handling, security, and performance optimizations.