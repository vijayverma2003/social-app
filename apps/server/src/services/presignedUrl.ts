import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
} from "../config/vars";

export interface PresignedUrlOptions {
  fileName: string;
  contentType: string;
  bucket: string;
  expiresIn?: number; // in seconds
}

export interface PresignedUrlResult {
  url: string;
  method: "PUT" | "POST";
  fields?: Record<string, string>; // For POST uploads with form fields
}

/**
 * Service for generating presigned URLs for Cloudflare R2 using AWS S3-compatible API
 * Documentation: https://developers.cloudflare.com/r2/api/s3/api/
 */
export class PresignedUrlService {
  private r2Client: S3Client;

  constructor() {
    // Initialize S3 client for Cloudflare R2 (S3-compatible API)
    // R2 uses the AWS S3-compatible API with a custom endpoint
    const r2AccountId = R2_ACCOUNT_ID;
    const r2AccessKeyId = R2_ACCESS_KEY_ID;
    const r2SecretAccessKey = R2_SECRET_ACCESS_KEY;

    if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey) {
      throw new Error(
        "R2 credentials are not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY environment variables."
      );
    }

    this.r2Client = new S3Client({
      region: "auto", // R2 uses "auto" as the region
      endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
      },
      // R2 uses virtual-hosted-style addressing by default
      forcePathStyle: false,
    });
  }

  /**
   * Generate a presigned URL for uploading a file to Cloudflare R2
   * @param options - Configuration options for the presigned URL
   * @returns Presigned URL and upload method
   */
  async generatePresignedUrl(
    options: PresignedUrlOptions
  ): Promise<PresignedUrlResult> {
    const {
      fileName,
      contentType,
      bucket,
      expiresIn = 5 * 60, // Default 5 minutes (matches schema default)
    } = options;

    // Create PutObject command for presigned URL
    // R2 uses the AWS S3-compatible API
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileName,
      ContentType: contentType,
    });

    // Generate presigned URL using AWS S3-compatible API for R2
    const url = await getSignedUrl(this.r2Client, command, {
      expiresIn,
    });

    return {
      url,
      method: "PUT",
    };
  }

  /**
   * Generate a presigned URL for downloading a file from Cloudflare R2
   * @param options - Configuration options for the presigned URL
   * @returns Presigned URL for downloading
   */
  async generateDownloadUrl(
    options: Omit<PresignedUrlOptions, "contentType">
  ): Promise<string> {
    const {
      fileName,
      bucket,
      expiresIn = 5 * 60, // Default 5 minutes (matches schema default)
    } = options;

    // Create GetObject command for presigned URL
    // R2 uses the AWS S3-compatible API
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileName,
    });

    // Generate presigned URL using AWS S3-compatible API for R2
    const url = await getSignedUrl(this.r2Client, command, {
      expiresIn,
    });

    return url;
  }
}

// Export singleton instance
export const presignedUrlService = new PresignedUrlService();
