import type { Plugin } from "vite";
import { handleApiRequest, isApiPath } from "./server/httpApi";

export function postgresPlugin(): Plugin {
  return {
    name: "postgres-db",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const parsed = new URL(req.url || "/", "http://localhost");
        if (!isApiPath(parsed.pathname)) {
          return next();
        }
        await handleApiRequest(req, res);
      });
    },
  };
}
