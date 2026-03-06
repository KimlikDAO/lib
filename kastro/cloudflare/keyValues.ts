import { ApiResponse, ApiV4, Auth } from "./api";
import {
  KvListKeysResponse,
  KvListKeysResult,
} from "./keyValues.d";

/**
 * Fetches key names from a KV namespace (single request, no pagination).
 */
const getExistingKeys = async (
  auth: Auth,
  namespaceId: string
): Promise<Set<string>> => {
  const url = `${ApiV4}/accounts/${auth.accountId}/storage/kv/namespaces/${namespaceId}/keys`;
  const res = await fetch(url, {
    headers: { authorization: `Bearer ${auth.token}` }
  });
  if (!res.ok) throw await res.text();
  const data = (await res.json()) as KvListKeysResponse;
  const result = data.result;
  if (result == null) return new Set();
  if (Array.isArray(result))
    return new Set(result.map((item) => item.name));
  const r = result as KvListKeysResult;
  return new Set(r.keys.map((k) => k.name));
};

/**
 * Uploads only keys that do not already exist in the namespace.
 * Fetches existing keys, diffs against the provided record, and bulk-PUTs new key-value pairs.
 */
const upload = async (
  auth: Auth,
  namespaceId: string,
  entries: Record<string, ArrayBuffer>
): Promise<ApiResponse> => {
  const existing = await getExistingKeys(auth, namespaceId);
  const toUpload = Object.keys(entries).filter((key) => !existing.has(key));
  if (toUpload.length == 0) return Promise.reject();

  const url = `${ApiV4}/accounts/${auth.accountId}/storage/kv/namespaces/${namespaceId}/bulk`;
  return fetch(url, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${auth.token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(
      toUpload.map((key) => ({
        key,
        value: new Uint8Array(entries[key]).toBase64(),
        base64: true
      }))
    )
  });
}

export default {
  getExistingKeys,
  upload
};
