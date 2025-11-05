import express from "express";
import * as database from "./database";
import router from "./routes";
import { clerkMiddleware } from "@clerk/express";

const app = express();

app.use(express.json());

app.use(clerkMiddleware());
app.use("/api", router);

async function main() {
  await database.connect();
  await database.ensureIndexes();

  const server = app.listen(3000, () => {
    console.log("Server is running on port 3000...");
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
