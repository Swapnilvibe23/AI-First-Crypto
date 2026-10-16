import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { mockupPreviewPlugin } from "./mockupPreviewPlugin";

// PORT and BASE_PATH are only provided by the Replit dev environment;
// fall back to Vite/production defaults so CI and `pnpm build` work without them.
// The port is used only by `server` / `preview`, not by `vite build`.
const rawPort = process.env.PORT ?? "5173";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH || "/";

function viteAllowedHosts(): string[] {
  const extras = [process.env.REPLIT_DEV_DOMAIN, process.env.REPLIT_DOMAINS, process.env.ALLOWED_HOSTS]
    .flatMap((value) => (value ? value.split(",") : []))
    .map((host) => host.trim())
    .filter(Boolean);
  return [
    "localhost",
    "127.0.0.1",
    ".replit.dev",
    ".replit.app",
    ".repl.co",
    ".netlify.app",
    ...extras,
  ];
}

export default defineConfig({
  base: basePath,
  plugins: [
    mockupPreviewPlugin(),
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: viteAllowedHosts(),
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: viteAllowedHosts(),
  },
});
