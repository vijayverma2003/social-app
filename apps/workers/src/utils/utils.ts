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

