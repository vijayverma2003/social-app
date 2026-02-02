import { GoogleGenAI } from "@google/genai";
import { GEMINI_API_KEY } from "../utils/vars";
import { normalizeVector } from "../utils/utils";

export const SUPPORTED_IMAGE_MIME_TYPES = {
    PNG: "image/png",
    JPEG: "image/jpeg",
    WEBP: "image/webp",
    HEIC: "image/heic",
    HEIF: "image/heif",
} as const;

export type SupportedImageMimeType =
    (typeof SUPPORTED_IMAGE_MIME_TYPES)[keyof typeof SUPPORTED_IMAGE_MIME_TYPES];

const CAPTION_MODEL = "gemini-2.5-flash-lite-preview-09-2025";
const CAPTION_PROMPT = "Generate a comprehensive caption for this image in less than 1000 characters";

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONALITY = 1536;

class GeminiAIService {
    private ai: GoogleGenAI;

    constructor() {
        this.ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    }

    /**
     * Creates an image caption from base64 image data.
     * @param base64ImageData - The image data encoded as base64
     * @param mimeType - The MIME type of the image (e.g. image/png, image/jpeg)
     * @returns The caption string, or null if the request failed
     */
    async createImageCaption(
        base64ImageData: string,
        mimeType: SupportedImageMimeType
    ): Promise<string | null> {
        try {
            const result = await this.ai.models.generateContent({
                model: CAPTION_MODEL,
                contents: [
                    {
                        inlineData: {
                            mimeType,
                            data: base64ImageData,
                        },
                    },
                    { text: CAPTION_PROMPT },
                ],
            });

            return result.text ?? null;
        } catch (error) {
            console.error(`Error creating image caption: ${error}`)
            return null;
        }
    }

    /**
     * Generates an embedding vector for the given text using Gemini.
     * @param content - Text to embed
     * @returns Array of 1536 dimensions, or null if the request failed
     */
    async generateVectorEmbedding(content: string): Promise<{ vector: number[], model: string, version: number } | null> {
        try {
            const result = await this.ai.models.embedContent({
                model: EMBEDDING_MODEL,
                contents: content,
                config: { outputDimensionality: EMBEDDING_DIMENSIONALITY },
            });
            const embedding = result.embeddings?.[0];
            if (!embedding) {
                console.error(`Error embedding content: No embedding returned`);
                return null;
            }

            const normalisedEmbedding = normalizeVector(embedding?.values ?? []);
            return {
                vector: normalisedEmbedding,
                model: EMBEDDING_MODEL,
                version: 1,
            }
        } catch (error) {
            console.error(`Error embedding content: ${error}`);
            return null;
        }
    }
}

export const geminiAIService = new GeminiAIService()