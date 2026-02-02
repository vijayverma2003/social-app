/**
 * L2-normalises a vector (unit length). Returns an object with the normalised
 * vector, embedding version, and model name.
 * @param vector - Raw embedding vector
 * @param options - Optional model name and embedding version
 * @returns Normalised embedding object, or null if the vector is zero (cannot normalise)
 */
export function normalizeVector(
    vector: number[],
    options?: { model?: string; embeddingVersion?: number }
  ): number[] {
    const norm = Math.sqrt(vector.reduce((sum, x) => sum + x * x, 0));
    if (norm === 0) return [];
    return vector.map((x) => x / norm);
  }
  