import { config } from "dotenv";
import path from "node:path"

config({ path: path.resolve(__dirname, "../.env") });

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";