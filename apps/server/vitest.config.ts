import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../../shared"),
      "@database/postgres": path.resolve(__dirname, "../../database/postgres"),
      "@database/mongodb": path.resolve(__dirname, "../../database/mongodb"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
});
