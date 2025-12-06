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

export const MONGODB_DATABASE_URL = process.env.MONGODB_DATABASE_URL;
export const MONGODB_DATABASE_NAME = process.env.MONGODB_DATABASE_NAME;
