import { ApiV4, Auth } from "./api";
import { KvBinding, WorkerUploadMetadata } from "./workers.d";

const upload = (
  auth: Auth,
  name: string,
  code: string | ArrayBuffer,
  kvBindings?: KvBinding[],
  bundleFiles?: Record<string, ArrayBuffer>
): Promise<unknown> => {
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const metadata: WorkerUploadMetadata = {
    main_module: "a.js",
    compatibility_date: yesterday
  };
  if (kvBindings?.length) {
    for (const kv of kvBindings) kv.type = "kv_namespace";
    metadata.bindings = kvBindings;
  }
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append(
    "a.js",
    new File([code], "a.js", { type: "application/javascript+module;charset=utf-8" })
  );
  if (bundleFiles) {
    for (const file of Object.keys(bundleFiles)) {
      form.append(
        file,
        new File([bundleFiles[file]], file, { type: "application/octet-stream" })
      );
    }
  }
  return fetch(`${ApiV4}/accounts/${auth.accountId}/workers/scripts/${name}`, {
    method: "PUT",
    headers: { authorization: `Bearer ${auth.token}` },
    body: form
  }).then((res) => res.json());
};

const bind = (auth: Auth, name: string, url: string): Promise<unknown> =>
  fetch(`${ApiV4}/accounts/${auth.accountId}/workers/domains`, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${auth.token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      environment: "production",
      hostname: url,
      service: name
    })
  }).then((res) => res.json());

const enableWorkersDev = (auth: Auth, name: string): Promise<unknown> =>
  fetch(
    `${ApiV4}/accounts/${auth.accountId}/workers/services/${name}/environments/production/subdomain`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${auth.token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ enabled: true })
    }
  ).then((res) => res.json());

export default {
  upload,
  bind,
  delete(auth: Auth, name: string): Promise<unknown> {
    return fetch(`${ApiV4}/accounts/${auth.accountId}/workers/scripts/${name}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${auth.token}` }
    }).then((res) => res.json());
  },
  enableWorkersDev
};
