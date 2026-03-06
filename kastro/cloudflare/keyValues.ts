import { ApiV4, Auth } from "./api";
import {
  KvListKeysResult,
  KvListKeysResponse,
} from "./keyValues.d";

/**
 * Fetches all existing key names from a KV namespace (handles pagination).
 */
const getExistingKeys = async (
  auth: Auth,
  namespaceId: string
): Promise<Set<string>> => {
  const keys = new Set<string>();
  let cursor: string | undefined;
  const url = new URL(
    `${ApiV4}/accounts/${auth.accountId}/storage/kv/namespaces/${namespaceId}/keys`);
  do {
    url.searchParams.set("limit", "1000");
    if (cursor) url.searchParams.set("cursor", cursor);

    const res = await fetch(url, {
      headers: { authorization: `Bearer ${auth.token}` }
    });
    if (!res.ok) throw await res.text();
    const data = (await res.json()) as KvListKeysResponse;
    const result = data.result;
    if (result != null && typeof result == "object" && "list_complete" in result) {
      const r = result as KvListKeysResult;
      for (const k of r.keys) keys.add(k.name);
      if (r.list_complete) {
        cursor = void 0;
      } else {
        cursor = r.cursor;
      }
    } else if (Array.isArray(result)) {
      for (const item of result) keys.add(item.name);
      break;
    }
  } while (cursor);

  return keys;
}

/**
 * Uploads only keys that do not already exist in the namespace.
 * Fetches existing keys, diffs against the provided record, and bulk-PUTs new key-value pairs.
 */
const upload = async (
  auth: Auth,
  namespaceId: string,
  entries: Record<string, ArrayBuffer>
): Promise<void> => {
  const existing = await getExistingKeys(auth, namespaceId);
  const toUpload = Object.keys(entries).filter((key) => !existing.has(key));
  if (toUpload.length == 0) return;

  const url = `${ApiV4}/accounts/${auth.accountId}/storage/kv/namespaces/${namespaceId}/bulk`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(
      toUpload.map((key) => ({
        key,
        value: new Uint8Array(entries[key]).toBase64(),
        base64: true
      }))
    )
  });
  if (!res.ok) throw `KV bulk put failed: ${await res.text()}`;
}

export default {
  getExistingKeys,
  upload
};
