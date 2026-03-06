interface KvBinding {
  name: string;
  namespace_id: string;
  type: "kv_namespace";
}

interface KvListKeyEntry {
  name: string;
  expiration?: number;
  metadata?: unknown;
}

interface KvListKeysResult {
  keys: KvListKeyEntry[];
  list_complete: boolean;
  cursor?: string;
}

interface KvListKeysResponse {
  result: KvListKeyEntry[] | KvListKeysResult;
  success?: boolean;
}

export {
  KvBinding,
  KvListKeyEntry,
  KvListKeysResult,
  KvListKeysResponse,
};
