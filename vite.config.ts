import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { postgresPlugin } from "./vite-plugin-local-db";
import { applyLoadedEnv } from "./server/loadEnv";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  applyLoadedEnv(env);

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
