import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

export const PORT = process.env.SERVER_PORT || 3000;
export const DATABASE_URL = process.env.MONGODB_DATABASE_URL;
export const DATABASE_NAME = process.env.MONGODB_DATABASE_NAME;
