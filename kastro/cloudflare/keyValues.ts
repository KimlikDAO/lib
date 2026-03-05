import { ApiV4, Auth } from "./api";
import { KvListKeysResponse, KvListKeysResult } from "./keyValues.d";

const isPaginatedResult = (
  result: KvListKeysResponse["result"]
): result is KvListKeysResult => {
  return result != null && typeof result === "object" && "keys" in result;
}

/**
 * Fetches all existing key names from a KV namespace (handles pagination).
 */
const getExistingKeys = async (
  auth: Auth,
  namespaceId: string
): Promise<Set<string>> => {
  const keys = new Set<string>();
  let cursor: string | undefined;
  do {
    const url = new URL(
      `${ApiV4}/accounts/${auth.accountId}/storage/kv/namespaces/${namespaceId}/keys`
    );
    url.searchParams.set("limit", "1000");
    if (cursor) url.searchParams.set("cursor", cursor);

    const res = await fetch(url.toString(), {
      headers: { authorization: `Bearer ${auth.token}` }
    });
    const data = (await res.json()) as KvListKeysResponse;
    if (!res.ok) throw new Error(JSON.stringify(data));

    const result = data.result;
    if (isPaginatedResult(result)) {
      for (const k of result.keys) keys.add(k.name);
      if (result.list_complete) {
        cursor = void 0;
      } else {
        cursor = result.cursor;
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
 * Gets existing keys, diffs against the provided record, and PUTs each new key-value pair.
 */
const uploadNewKeys = async (
  auth: Auth,
  namespaceId: string,
  entries: Record<string, ArrayBuffer>
): Promise<{ uploaded: string[] }> => {
  const existing = await getExistingKeys(auth, namespaceId);
  const toUpload = Object.keys(entries).filter((key) => !existing.has(key));
  const base = `${ApiV4}/accounts/${auth.accountId}/storage/kv/namespaces/${namespaceId}/values`;

  for (const key of toUpload) {
    const value = entries[key];
    const res = await fetch(`${base}/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { authorization: `Bearer ${auth.token}` },
      body: value
    });
    if (!res.ok) throw new Error(`KV put failed for ${key}: ${await res.text()}`);
  }

  return { uploaded: toUpload };
}

export default {
  getExistingKeys,
  uploadNewKeys
};
