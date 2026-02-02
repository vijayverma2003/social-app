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

/**
 * Fetches an image from the given URL and returns its data as a base64 string.
 * @param imageUrl - The URL of the image to fetch
 * @returns The base64-encoded image data, or null if the fetch failed
 */
export async function imageUrlToBase64(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return null;
    }
    const imageArrayBuffer = await response.arrayBuffer();
    const base64ImageData = Buffer.from(imageArrayBuffer).toString("base64");
    return base64ImageData;
  } catch {
    return null;
  }
}

