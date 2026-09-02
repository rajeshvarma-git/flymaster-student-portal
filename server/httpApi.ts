import type { IncomingMessage, ServerResponse } from "http";
import {
  deleteStorageFiles,
  ensureSchema,
  insertAuthUser,
  mutateAppState,
  pingPostgres,
  readAppState,
  readStorageFile,
  writeAppState,
  writeStorageFile,
} from "./postgres";
import {
  destroySession,
  getSessionByToken,
  readBearerToken,
  signInUser,
  signUpUser,
  updatePasswordForToken,
} from "./studentAuth";

const API_PATHS = new Set(["/__local_db", "/__db_health", "/__auth", "/__session", "/__storage"]);

export function isApiPath(pathname: string) {
  return API_PATHS.has(pathname);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify(payload, (_key, value) => {
      if (typeof value === "bigint") return Number(value);
      if (value instanceof Date) return value.toISOString();
      return value;
    })
  );
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse) {
  const parsed = new URL(req.url || "/", "http://localhost");
  const url = parsed.pathname;

  try {
    if (url === "/__db_health") {
      const info = await pingPostgres();
      sendJson(res, 200, { ok: true, ...info });
      return;
    }

    if (url === "/__auth" && req.method === "GET") {
      const session = await getSessionByToken(readBearerToken(req));
      sendJson(res, 200, { session });
      return;
    }

    if (url === "/__auth" && req.method === "POST") {
      const body = JSON.parse((await readBody(req)) || "{}");
      if (body.action === "signin") {
        const result = await signInUser(body.email, body.password);
        sendJson(res, result.error ? (result.status || 401) : 200, result.error ? { error: result.error } : { session: result.session });
        return;
      }
      if (body.action === "signup") {
        const result = await signUpUser({
          email: body.email,
          password: body.password,
          user_metadata: body.user_metadata || body.data || {},
        });
        sendJson(res, result.error ? (result.status || 400) : 200, result.error ? { error: result.error } : { session: result.session });
        return;
      }
      if (body.action === "signout") {
        await destroySession(body.token || readBearerToken(req));
        sendJson(res, 200, { ok: true, session: null });
        return;
      }
      if (body.action === "password") {
        const result = await updatePasswordForToken(body.token || readBearerToken(req), body.password);
        sendJson(res, result.error ? (result.status || 400) : 200, result.error ? { error: result.error } : { user: result.user });
        return;
      }
      if (body.action === "insert" && body.user) {
        await insertAuthUser(body.user);
        sendJson(res, 200, { ok: true });
        return;
      }
      sendJson(res, 400, { error: "Unknown auth action" });
      return;
    }

    if (url === "/__session" && req.method === "PUT") {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (url === "/__storage" && req.method === "GET") {
      const filePath = parsed.searchParams.get("path") || "";
      const dataUrl = await readStorageFile(filePath);
      if (!dataUrl) {
        sendJson(res, 404, { error: "File not found" });
        return;
      }
      sendJson(res, 200, { dataUrl });
      return;
    }

    if (url === "/__storage" && req.method === "PUT") {
      const body = JSON.parse((await readBody(req)) || "{}");
      await writeStorageFile(body.path, body.dataUrl);
      sendJson(res, 200, { ok: true, path: body.path });
      return;
    }

    if (url === "/__storage" && req.method === "DELETE") {
      const body = JSON.parse((await readBody(req)) || "{}");
      await deleteStorageFiles(body.paths || []);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (url === "/__local_db" && req.method === "GET") {
      await ensureSchema();
      const table = parsed.searchParams.get("table") || undefined;
      const state = await readAppState({ table, includeStorage: false });
      sendJson(res, 200, table ? { rows: state.tables[table] || [] } : state);
      return;
    }

    if (url === "/__local_db" && req.method === "POST") {
      const body = await readBody(req);
      const result = await mutateAppState(JSON.parse(body || "{}"));
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (url === "/__local_db" && req.method === "PUT") {
      const body = await readBody(req);
      await writeAppState(JSON.parse(body || "{}"));
      sendJson(res, 200, { ok: true });
      return;
    }

    sendJson(res, 405, { error: "Method not allowed" });
  } catch (error: any) {
    sendJson(res, 500, { error: error.message });
  }
}
