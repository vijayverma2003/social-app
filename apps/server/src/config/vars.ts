import dotenv from "dotenv";
import path from "path";
import { existsSync } from "fs";

function findProjectRoot(startPath: string): string {
  let currentPath = startPath;
  while (currentPath !== path.dirname(currentPath)) {
    const envPath = path.join(currentPath, ".env");
    if (existsSync(envPath)) return currentPath;
    currentPath = path.dirname(currentPath);
  }
  return currentPath;
}

const projectRoot = findProjectRoot(__dirname);
const envPath = path.join(projectRoot, ".env");

dotenv.config({ path: envPath });

export const PORT = process.env.SERVER_PORT || 3000;
export const DATABASE_URL = process.env.MONGODB_DATABASE_URL;
export const DATABASE_NAME = process.env.MONGODB_DATABASE_NAME;
export const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
export const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
export const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
export const R2_BUCKET = process.env.R2_BUCKET || "attachments";
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";
export const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "";
export const NEXT_PUBLIC_URL = process.env.NEXT_PUBLIC_URL || "";
