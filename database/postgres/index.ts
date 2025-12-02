import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
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

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const pool = new Pool({
  connectionString: process.env.POSTGRESQL_DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
