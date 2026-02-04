/**
 * Nietzsche Plugin
 *
 * Scrapes Nietzsche books from archive.org, ingests text,
 * creates vector embeddings in Convex, and provides Q&A functionality.
 *
 * MIT License - Free to use, modify, and distribute
 *
 * @module plugins/nietzsche
 */

import type { Plugin } from './types.js';
import type { Agent } from '../core/agent.js';

/**
 * Nietzsche book metadata from archive.org (public domain)
 */
interface NietzscheBook {
  identifier: string;
  title: string;
  url: string;
}

/**
 * Default Nietzsche books from archive.org (public domain texts)
 */
const NIETZSCHE_BOOKS: NietzscheBook[] = [
  {
    identifier: 'beyondgoodandevi00nietuoft',
    title: 'Beyond Good and Evil',
    url: 'https://archive.org/download/beyondgoodandevi00nietuoft/beyondgoodandevi00nietuoft_djvu.txt'
  },
  {
    identifier: 'thusspokezarathu00nietuoft',
    title: 'Thus Spoke Zarathustra',
    url: 'https://archive.org/download/thusspokezarathu00nietuoft/thusspokezarathu00nietuoft_djvu.txt'
  },
  {
    identifier: 'genealogyofmoral00nietuoft',
    title: 'On the Genealogy of Morals',
    url: 'https://archive.org/download/genealogyofmoral00nietuoft/genealogyofmoral00nietuoft_djvu.txt'
  },
  {
    identifier: 'twilightidolsant00nietuoft',
    title: 'Twilight of the Idols',
    url: 'https://archive.org/download/twilightidolsant00nietuoft/twilightidolsant00nietuoft_djvu.txt'
  },
];

/**
 * Nietzsche Plugin - MIT Licensed
 */
export const nietzschePlugin: Plugin = {
  name: 'nietzsche',
  version: '1.0.0',
  description: 'Ingests public domain Nietzsche texts and provides Q&A via semantic search',

  async init(agent: Agent) {
    console.log('🐧 Nietzsche Plugin initialized');
    console.log('Available actions: ingest, ask, listBooks, getPassage');
  },

  actions: {
    /**
     * List available Nietzsche books (public domain)
     */
    async listBooks() {
      return NIETZSCHE_BOOKS.map((book) => ({
        title: book.title,
        identifier: book.identifier,
        source: 'archive.org (public domain)',
      }));
    },

    /**
     * Ingest a Nietzsche book into Convex vector store
     */
    async ingest(params: Record<string, unknown>, agent: Agent) {
      const { bookIdentifier } = params;

      if (!bookIdentifier || typeof bookIdentifier !== 'string') {
        throw new Error('bookIdentifier is required');
      }

      const book = NIETZSCHE_BOOKS.find((b) => b.identifier === bookIdentifier);
      if (!book) {
        throw new Error(`Book not found: ${bookIdentifier}`);
      }

      console.log(`📚 Ingesting "${book.title}" from archive.org...`);

      try {
        // Fetch public domain text from archive.org
        const response = await fetch(book.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch book: ${response.statusText}`);
        }

        const text = await response.text();
        console.log(`📄 Downloaded ${Math.round(text.length / 1024)}KB`);

        // Clean and chunk the text
        const chunks = chunkText(text, 500); // 500 words per chunk
        console.log(`✂️  Split into ${chunks.length} chunks`);

        // Store each chunk as a semantic memory with embeddings
        let stored = 0;
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];

          try {
            await agent.memory.store({
              content: chunk,
              type: 'semantic',
              scope: 'long_term',
              importance: 0.8,
              salience: 0.7,
              valence: 0.0,
              confidence: 1.0,
              tags: ['nietzsche', book.title.toLowerCase().replace(/\s+/g, '-'), 'philosophy'],
              sourceType: 'book',
              metadata: {
                book: book.title,
                identifier: book.identifier,
                chunk: i,
                totalChunks: chunks.length,
              },
            });
            stored++;

            if (stored % 10 === 0) {
              console.log(`  📝 Stored ${stored}/${chunks.length} chunks...`);
            }
          } catch (error) {
            console.error(`Failed to store chunk ${i}:`, error);
          }
        }

        console.log(`✅ Ingested "${book.title}" - ${stored}/${chunks.length} chunks stored`);

        return {
          success: true,
          book: book.title,
          chunks: stored,
          totalChunks: chunks.length,
        };
      } catch (error) {
        console.error('❌ Ingestion failed:', error);
        throw error;
      }
    },

    /**
     * Ask a question and get relevant passages using vector search
     */
    async ask(params: Record<string, unknown>, agent: Agent) {
      const { question, limit = 3 } = params;

      if (!question || typeof question !== 'string') {
        throw new Error('question is required');
      }

      console.log(`🤔 Question: "${question}"`);

      try {
        // Search for relevant passages using semantic search
        const results = await agent.memory.search({
          query: question,
          limit: limit as number,
          type: 'semantic',
          tags: ['nietzsche'],
        });

        if (results.length === 0) {
          return {
            answer: 'No relevant passages found. Have you ingested any books yet? Use action "ingest".',
            passages: [],
          };
        }

        // Format passages
        const passages = results.map((result) => ({
          text: result.content,
          book: result.metadata?.book || 'Unknown',
          relevance: result.similarity || 0,
        }));

        console.log(`📖 Found ${passages.length} relevant passages`);

        return {
          question,
          passages,
          count: passages.length,
        };
      } catch (error) {
        console.error('❌ Q&A failed:', error);
        throw error;
      }
    },

    /**
     * Get a random passage from Nietzsche's works
     */
    async getPassage(params: Record<string, unknown>, agent: Agent) {
      const { book } = params;

      try {
        // Get all Nietzsche memories
        const allMemories = await agent.memory.search({
          query: '',
          limit: 100,
          tags: ['nietzsche'],
        });

        if (allMemories.length === 0) {
          return {
            passage: 'No passages available. Please ingest books first using action "ingest".',
          };
        }

        // Filter by book if specified
        let filtered = allMemories;
        if (book && typeof book === 'string') {
          filtered = allMemories.filter(
            (m) => m.metadata?.book?.toLowerCase().includes(book.toLowerCase())
          );
        }

        if (filtered.length === 0) {
          return {
            passage: `No passages found for book: ${book}`,
          };
        }

        // Get random passage
        const randomIndex = Math.floor(Math.random() * filtered.length);
        const memory = filtered[randomIndex];

        return {
          passage: memory.content,
          book: memory.metadata?.book || 'Unknown',
          source: 'archive.org (public domain)',
        };
      } catch (error) {
        console.error('❌ Failed to get passage:', error);
        throw error;
      }
    },
  },
};

/**
 * Chunk text into smaller pieces for embedding
 * @param text - Full text to chunk
 * @param wordsPerChunk - Target words per chunk (default 500)
 * @returns Array of text chunks
 */
function chunkText(text: string, wordsPerChunk: number = 500): string[] {
  // Clean the text
  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Split into paragraphs
  const paragraphs = cleaned.split(/\n\n+/).filter((p) => p.trim().length > 0);

  const chunks: string[] = [];
  let currentChunk = '';
  let currentWordCount = 0;

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/);
    const wordCount = words.length;

    // If adding this paragraph exceeds limit, save current chunk and start new one
    if (currentWordCount + wordCount > wordsPerChunk && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
      currentWordCount = 0;
    }

    // Add paragraph to current chunk
    currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    currentWordCount += wordCount;

    // If current chunk is large enough, save it
    if (currentWordCount >= wordsPerChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
      currentWordCount = 0;
    }
  }

  // Add remaining chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Create the Nietzsche plugin instance
 */
export function createNietzschePlugin(): Plugin {
  return nietzschePlugin;
}
