import {
  knowledgeDocuments,
  type KnowledgeDocument,
} from "./documents.js";

const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "be",
  "do",
  "for",
  "how",
  "in",
  "is",
  "of",
  "on",
  "should",
  "the",
  "to",
  "what",
]);

function tokens(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 1 && !stopWords.has(token)),
  );
}

export interface RetrievedChunk extends KnowledgeDocument {
  score: number;
}

export class KnowledgeRetriever {
  constructor(
    private readonly documents: KnowledgeDocument[] = knowledgeDocuments,
  ) {}

  retrieve(query: string, limit = 3): RetrievedChunk[] {
    const queryTokens = tokens(query);

    return this.documents
      .map((document) => {
        const documentTokens = tokens(`${document.title} ${document.text}`);
        const overlap = [...queryTokens].filter((token) =>
          documentTokens.has(token),
        ).length;
        return { ...document, score: overlap };
      })
      .filter((document) => document.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, limit);
  }
}
