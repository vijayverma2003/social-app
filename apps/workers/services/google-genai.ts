import { GoogleGenAI } from "@google/genai";

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

class GoogleGenAIService {
    private ai: GoogleGenAI;

    constructor(options: ConstructorParameters<typeof GoogleGenAI>[0] = {}) {
        this.ai = new GoogleGenAI(options);
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
}

export const googleGenAIService = new GoogleGenAIService({
    apiKey: process.env.GOOGLE_GENAI_API_KEY ?? "",
})