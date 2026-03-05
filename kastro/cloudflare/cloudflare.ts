import { secrets } from "bun";
import { readFile } from "node:fs/promises";
import { BundleReport, getEtags } from "../compiler/bundleReport";
import compiler from "../compiler/compiler";
import type { Auth } from "./api";
import keyValues from "./keyValues";
import workers from "./workers";

export interface CloudflareDeployConfig {
  workerName: string;
  namespaceId: string;
  /** Directory containing built bundle assets (default "build/bundle"). */
  bundleDir?: string;
  /** Service and name for Bun secrets lookup of Auth JSON (default service "kastro", name "CloudflareAuth"). */
  authService?: string;
  authSecretName?: string;
}

/** Optional overrides for testing (e.g. inject getAuth). */
export interface CloudflareDeployOptions {
  getAuth?: (config: CloudflareDeployConfig) => Promise<Auth>;
}

/**
 * Resolves Auth from Bun secrets. Expects the secret value to be JSON: { accountId, token }.
 */
async function getAuth(config: CloudflareDeployConfig): Promise<Auth> {
  const service = config.authService ?? "kastro";
  const name = config.authSecretName ?? "CloudflareAuth";
  const raw = await secrets.get({ service, name });
  if (raw == null || raw === "") {
    throw new Error(`Missing secret: ${service}/${name}`);
  }
  const auth = JSON.parse(raw) as Auth;
  if (!auth.accountId || !auth.token) {
    throw new Error(`Secret ${service}/${name} must have accountId and token`);
  }
  return auth;
}

/**
 * Reads bundle assets from disk into Record<key, ArrayBuffer>.
 * For each name in hashedAssets, reads name, name.br, and name.gz if present.
 */
async function readBundleEntries(
  bundleDir: string,
  hashedAssets: string[]
): Promise<Record<string, ArrayBuffer>> {
  const entries: Record<string, ArrayBuffer> = {};
  for (const name of hashedAssets) {
    const path = `${bundleDir}/${name}`;
    try {
      const buf = await readFile(path);
      const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
      entries[name] = ab as ArrayBuffer;
    } catch {
      // Skip missing files (e.g. in tests or when asset wasn't built)
    }
    for (const ext of [".br", ".gz"]) {
      const pathExt = `${path}${ext}`;
      try {
        const buf = await readFile(pathExt);
        const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
        entries[`${name}${ext}`] = ab as ArrayBuffer;
      } catch {
        // Optional compressed variant
      }
    }
  }
  return entries;
}

/**
 * Builds the worker, deploys it to Cloudflare Workers, and uploads hashed assets to KV.
 */
async function deploy(
  bundleReport: BundleReport,
  config: CloudflareDeployConfig,
  options?: CloudflareDeployOptions
): Promise<{ worker: unknown; kv: { uploaded: string[] } }> {
  const auth = options?.getAuth ? await options.getAuth(config) : await getAuth(config);
  const bundleDir = config.bundleDir ?? "build/bundle";
  const workerName = config.workerName;

  const target = await compiler.buildTarget("/build/bundledWorker.js", {
    dynamicDeps: true,
    src: "lib/kastro/cloudflare/bundledWorker.ts",
    BuildMode: compiler.BuildMode.Release,
    globals: {
      HOST_URL: bundleReport.hostUrl ?? "",
      ETAGS: getEtags(bundleReport)
    }
  });

  const code = typeof target.content === "string"
    ? new TextEncoder().encode(target.content).buffer
    : (target.content.buffer.slice(
        target.content.byteOffset,
        target.content.byteOffset + target.content.byteLength
      ) as ArrayBuffer);

  const kvBindings = [{ name: "K", namespace_id: config.namespaceId, type: "kv_namespace" as const }];

  const workerResult = await workers.upload(auth, workerName, code as ArrayBuffer, kvBindings);

  const entries = await readBundleEntries(bundleDir, bundleReport.hashedAssets);
  const kvResult = await keyValues.uploadNewKeys(auth, config.namespaceId, entries);

  return { worker: workerResult, kv: kvResult };
}

export default {
  deploy,
  getAuth,
  readBundleEntries,
};
