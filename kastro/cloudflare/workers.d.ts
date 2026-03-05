/**
 * KV namespace binding for Cloudflare Workers script upload.
 * @see https://developers.cloudflare.com/api/operations/worker-scripts-upload-worker
 */
export interface KvBinding {
  name: string;
  namespace_id: string;
  type?: "kv_namespace";
}

/**
 * Metadata payload for Workers script upload (PUT /workers/scripts/:script_name).
 * Property names must match Cloudflare API; keep in .d.ts so they are not mangled.
 */
export interface WorkerUploadMetadata {
  main_module: string;
  compatibility_date: string;
  bindings?: KvBinding[];
}
