import express from "express";
import { createServer } from "http";
import SocketIOProvider from "./socket";
import cors from "cors";
import * as mongodb from "@database/mongodb";
import router from "./routes";
import { clerkMiddleware } from "@clerk/express";
import { NEXT_PUBLIC_URL, PORT } from "./config/vars";
import { errorHandler } from "./middleware/errorMiddleware";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./services/auth";

const app = express();

app.use(
  cors({
    origin: [NEXT_PUBLIC_URL],
    credentials: true,
  }),
);

app.all(`/api/v1/auth/*splat`, toNodeHandler(auth));

app.use(express.json());
app.use(clerkMiddleware());
app.use("/api", router);
app.use(errorHandler);

async function main() {
  console.log("Connecting to MongoDB...");
  await mongodb.connect();
  console.log("Ensuring indexes...");
  await mongodb.ensureIndexes();

  const server = createServer(app);
  SocketIOProvider.initialize(server);

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}...`);
  });

  const shutdown = async () => {
    server.close();
    await mongodb.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.on("SIGQUIT", shutdown);
}

main();
