import type { Config } from "@netlify/functions";
import { handleApiRequest, type ApiLogger } from "../../../api-server/src/api";

const log: ApiLogger = {
  error: (err, msg) => console.error(msg, err instanceof Error ? err.message : err),
};

export default async (req: Request) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  const result = await handleApiRequest(new URL(req.url), log);
  return Response.json(result.body, { status: result.status, headers: result.headers });
};

export const config: Config = {
  path: "/api/*",
};
