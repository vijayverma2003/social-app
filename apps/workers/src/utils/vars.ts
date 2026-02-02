import dotenv from "dotenv";
import path from "node:path"

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
