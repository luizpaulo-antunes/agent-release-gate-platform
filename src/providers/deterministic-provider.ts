import type { KnowledgeSearchResult } from "../contracts/tool-contracts.js";

export class DeterministicProvider {
  answerFromKnowledge(result: KnowledgeSearchResult): {
    answer: string;
    citations: string[];
  } {
    const [first] = result.chunks;
    if (!first) {
      return {
        answer: "I could not find grounded evidence in the approved knowledge base.",
        citations: [],
      };
    }

    return {
      answer: `According to ${first.title}: ${first.text}`,
      citations: result.chunks.map((chunk) => chunk.id),
    };
  }
}
