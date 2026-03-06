import { ApiResponse, ApiV4, Auth } from "./api";
import { CloudflareDeployConfig } from "./cloudflare";
import { KvBinding } from "./keyValues.d";
import { WorkerUploadMetadata } from "./workers.d";

const upload = (
  auth: Auth,
  name: string,
  code: string | Uint8Array,
  kvBindings: KvBinding[],
  bundleFiles: Record<string, ArrayBuffer>
): Promise<ApiResponse> => {
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const metadata: WorkerUploadMetadata = {
    main_module: "a.js",
    compatibility_date: yesterday,
    bindings: kvBindings
  };
  const form = new FormData();
  form.append("metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("a.js",
    new File([code], "a.js", { type: "application/javascript+module;charset=utf-8" }));
  for (const file in bundleFiles)
    form.append(file,
      new File([bundleFiles[file]], file, { type: "application/octet-stream" }));

  return fetch(`${ApiV4}/accounts/${auth.accountId}/workers/scripts/${name}`, {
    method: "PUT",
    headers: { authorization: `Bearer ${auth.token}` },
    body: form
  }).then(
    (res) => res.json() as ApiResponse
  );
};

const bind = (
  auth: Auth,
  config: CloudflareDeployConfig,
  url: string
): Promise<ApiResponse> => {
  return fetch(`${ApiV4}/accounts/${auth.accountId}/workers/domains`, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${auth.token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      environment: "production",
      zone_id: config.zoneId,
      hostname: url.slice("https://".length),
      service: config.workerName
    })
  }).then(
    (res) => res.json() as ApiResponse
  );
}

const enableWorkersDev = (
  auth: Auth,
  name: string
): Promise<ApiResponse> => {
  return fetch(
    `${ApiV4}/accounts/${auth.accountId}/workers/services/${name}/environments/production/subdomain`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${auth.token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ enabled: true })
    }
  ).then(
    (res) => res.json() as ApiResponse
  );
}

export default {
  upload,
  bind,
  delete(
    auth: Auth,
    name: string
  ): Promise<ApiResponse> {
    return fetch(`${ApiV4}/accounts/${auth.accountId}/workers/scripts/${name}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${auth.token}` }
    }).then(
      (res) => res.json() as ApiResponse
    );
  },
  enableWorkersDev
};
