import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { postgresPlugin } from "./vite-plugin-local-db";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (env.DATABASE_URL) {
    process.env.DATABASE_URL = env.DATABASE_URL;
  }

  return {
    server: {
      host: true,
      port: 8087,
      allowedHosts: true,
    },
    plugins: [react(), postgresPlugin()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
