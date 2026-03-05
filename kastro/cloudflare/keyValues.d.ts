/**
 * Single key entry in a KV list response (paginated or array form).
 * Property names must match Cloudflare API; keep in .d.ts so they are not mangled.
 */
interface KvListKeyEntry {
  name: string;
  expiration?: number;
  metadata?: unknown;
}

/**
 * Paginated list response shape from GET .../storage/kv/namespaces/:id/keys.
 * Property names must match Cloudflare API; keep in .d.ts so they are not mangled.
 */
interface KvListKeysResult {
  keys: KvListKeyEntry[];
  list_complete: boolean;
  cursor?: string;
}

/**
 * Response wrapper for GET .../storage/kv/namespaces/:id/keys.
 * result can be either the paginated object or a direct array of keys.
 */
interface KvListKeysResponse {
  result: KvListKeyEntry[] | KvListKeysResult;
  success?: boolean;
}

export {
  KvListKeyEntry,
  KvListKeysResult,
  KvListKeysResponse,
};
