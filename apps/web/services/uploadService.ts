import axios from "axios";
import { UPLOAD_EVENTS } from "@shared/socketEvents";
import {
  UploadInitPayload,
  UploadCompletePayload,
  UploadInitialisedResponse,
  UploadCompletedResponse,
} from "@shared/schemas/fileAttachment";
import { socketService } from "./socketService";
import { ClientToServerEvents } from "@shared/types/socket";

type UploadInitCallback = Parameters<
  ClientToServerEvents[typeof UPLOAD_EVENTS.INIT]
>[1];

type UploadCompleteCallback = Parameters<
  ClientToServerEvents[typeof UPLOAD_EVENTS.COMPLETE]
>[1];

export interface UploadResult {
  storageObjectId: string;
  url: string;
  fileName: string;
  contentType: string;
  size: number;
}

export interface UploadProgress {
  fileName: string;
  status:
    | "calculating-hash"
    | "initializing"
    | "uploading"
    | "verifying"
    | "done"
    | "failed";
  progress?: number; // 0-100 for upload progress
  error?: string;
}

/**
 * Calculate SHA-256 hash of a file
 */
const calculateFileHash = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
};

/**
 * Initialize upload and get presigned URL
 */
const initializeUpload = (
  payload: UploadInitPayload
): Promise<UploadInitialisedResponse> => {
  return new Promise((resolve, reject) => {
    socketService.emit(UPLOAD_EVENTS.INIT, payload, ((response) => {
      if (response.error) reject(new Error(response.error));
      else if (response.success && response.data) resolve(response.data);
      else reject(new Error("Failed to initialize upload"));
    }) as UploadInitCallback);
  });
};

/**
 * Upload file to presigned URL
 */
const uploadToPresignedUrl = async (
  file: File,
  presignedUrl: string,
  onProgress?: (progress: number) => void
): Promise<void> => {
  await axios.put(presignedUrl, file, {
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const progress = Math.round(
          (progressEvent.loaded / progressEvent.total) * 100
        );
        onProgress(progress);
      }
    },
  });
};

/**
 * Complete upload and verify hash
 */
const completeUpload = (
  payload: UploadCompletePayload
): Promise<UploadCompletedResponse> => {
  return new Promise((resolve, reject) => {
    socketService.emit(UPLOAD_EVENTS.COMPLETE, payload, ((response) => {
      if (response.error) reject(new Error(response.error));
      else if (response.success && response.data) resolve(response.data);
      else reject(new Error("Failed to complete upload"));
    }) as UploadCompleteCallback);
  });
};

/**
 * Upload a single file
 * @param file - The file to upload
 * @param onProgress - Optional callback for upload progress updates
 * @returns Promise with upload result containing storageObjectId, url, and file metadata
 */
export const uploadFile = async (
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  try {
    // Step 1: Calculate hash
    onProgress?.({
      fileName: file.name,
      status: "calculating-hash",
    });

    const hash = await calculateFileHash(file);

    // Step 2: Initialize upload
    onProgress?.({
      fileName: file.name,
      status: "initializing",
    });

    const initResponse = await initializeUpload({
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      size: file.size,
      hash,
    });

    // Step 3: If file already exists, return immediately
    if (initResponse.url) {
      onProgress?.({
        fileName: file.name,
        status: "done",
        progress: 100,
      });

      return {
        storageObjectId: initResponse.storageObjectId,
        url: initResponse.url,
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        size: file.size,
      };
    }

    // Step 4: Upload to presigned URL
    if (!initResponse.presignedUrl) {
      throw new Error("Missing presigned URL for upload");
    }

    onProgress?.({
      fileName: file.name,
      status: "uploading",
      progress: 0,
    });

    await uploadToPresignedUrl(file, initResponse.presignedUrl, (progress) => {
      onProgress?.({
        fileName: file.name,
        status: "uploading",
        progress,
      });
    });

    // Step 5: Complete upload and verify hash
    onProgress?.({
      fileName: file.name,
      status: "verifying",
      progress: 100,
    });

    const completeResponse = await completeUpload({
      storageObjectId: initResponse.storageObjectId,
      hash,
    });

    onProgress?.({
      fileName: file.name,
      status: "done",
      progress: 100,
    });

    return {
      storageObjectId: completeResponse.storageObjectId,
      url: completeResponse.url,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      size: file.size,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    onProgress?.({
      fileName: file.name,
      status: "failed",
      error: errorMessage,
    });

    throw error;
  }
};

/**
 * Upload multiple files in parallel
 * @param files - Array of files to upload
 * @param onProgress - Optional callback for upload progress updates (receives updates for all files)
 * @returns Promise with array of upload results
 */
export const uploadFiles = async (
  files: File[],
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult[]> => {
  if (files.length === 0) return [];

  const uploadPromises = files.map((file) => uploadFile(file, onProgress));

  try {
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    // Even if some uploads fail, return the successful ones
    // Individual errors are already handled in uploadFile
    throw error;
  }
};

const uploadFilesService = {
  uploadFile,
  uploadFiles,
  calculateFileHash,
  initializeUpload,
  uploadToPresignedUrl,
  completeUpload,
};

export default uploadFilesService;
