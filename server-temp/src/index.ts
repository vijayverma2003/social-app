import express from "express";
import cors from "cors";
import * as database from "./database";
import router from "./routes";
import { clerkMiddleware } from "@clerk/express";
import { PORT } from "./config/vars";

const app = express();

// Enable CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.use(clerkMiddleware());
app.use("/api", router);

async function main() {
  await database.connect();
  await database.ensureIndexes();

  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}...`);
  });

  const shutdown = async () => {
    server.close();
    await database.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.on("SIGQUIT", shutdown);
}

main();
