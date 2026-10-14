export interface Chunk {
  index: number;
  content: string;
  startChar: number;
  endChar: number;
}

export function chunkText(text: string, maxChunkSize: number = 500, overlap: number = 50): Chunk[] {
  const chunks: Chunk[] = [];
  if (text.length === 0) return chunks;

  const sentences = splitSentences(text);
  let currentChunk = "";
  let startChar = 0;
  let chunkIndex = 0;

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push({
        index: chunkIndex,
        content: currentChunk.trim(),
        startChar,
        endChar: startChar + currentChunk.length,
      });
      chunkIndex++;

      const overlapText = currentChunk.slice(-overlap);
      startChar = startChar + currentChunk.length - overlapText.length;
      currentChunk = overlapText;
    }
    currentChunk += sentence;
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      index: chunkIndex,
      content: currentChunk.trim(),
      startChar,
      endChar: startChar + currentChunk.length,
    });
  }

  return chunks;
}

function splitSentences(text: string): string[] {
  const parts = text.split(/(?<=[.!?])\s+/);
  return parts.map((p, i) => (i < parts.length - 1 ? p + " " : p));
}
