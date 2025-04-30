import { defineConfig } from "vite";

export default defineConfig({
  test: {
    setupFiles: ["src/tests/setup.ts"],
  },
});
