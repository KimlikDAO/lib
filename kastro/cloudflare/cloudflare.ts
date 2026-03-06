import { file, secrets } from "bun";
import { getSecret } from "../../util/cli";
import { getExt } from "../../util/paths";
import { BundleReport, getEtags } from "../compiler/bundleReport";
import compiler from "../compiler/compiler";
import { CompressedMimes } from "../workers/mimes";
import { Auth } from "./api";
import { CloudflareDeployConfig } from "./cloudflare.d";
import keyValues from "./keyValues";
import { KvBinding } from "./keyValues.d";
import workers from "./workers";

const readBundleFiles = (
  bundleDir: string,
  bundleReport: BundleReport
): Promise<Record<string, ArrayBuffer>> => {
  const names: string[] = bundleReport.hashedAssets.slice();
  for (const name of bundleReport.hashedAssets)
    if (!CompressedMimes[getExt(name)]) {
      names.push(`${name}.br`);
      names.push(`${name}.gz`);
    }
  for (const name in bundleReport.namedAssets) {
    names.push(name);
    names.push(`${name}.br`);
    names.push(`${name}.gz`);
  }
  return Promise.all(names.map(
    (name) => file(`${bundleDir}/${name}`).arrayBuffer().then((buff) => [name, buff])))
    .then(Object.fromEntries);
}

const ServiceName = "org.kimlikdao.kastro.test";

const getAuth = async (): Promise<Auth> => {
  let accountId = await getSecret(ServiceName, "CloudflareAccountId");
  let token = await getSecret(ServiceName, "CloudflareToken");
  return { accountId, token };
}

const resetSecrets = async (): Promise<[boolean, boolean]> => Promise.all([
  secrets.delete({ service: ServiceName, name: "CloudflareAccountId" }),
  secrets.delete({ service: ServiceName, name: "CloudflareToken" })
]);

const deploy = async (
  bundleReport: BundleReport,
  config: CloudflareDeployConfig,
): Promise<void> => {
  const targetPromise = compiler.buildTarget("/build/bundledWorker.js", {
    dynamicDeps: true,
    src: "lib/kastro/cloudflare/bundledWorker.ts",
    BuildMode: compiler.BuildMode.Release,
    globals: {
      HOST_URL: bundleReport.hostUrl,
      ETAGS: getEtags(bundleReport)
    }
  });
  const [auth, { content: code }, bundleFiles] = await Promise.all([
    getAuth(),
    targetPromise,
    readBundleFiles("build/bundle", bundleReport)
  ]);

  const kvBindings: KvBinding[] = [{
    name: "K",
    namespace_id: config.namespaceId,
    type: "kv_namespace"
  }];
  console.log(bundleReport);
  const workerRes = await workers.upload(auth, config.workerName, code, kvBindings, bundleFiles);
  console.log("Worker upload:", workerRes);
  const bindRes = await workers.bind(auth, config, bundleReport.hostUrl as string);
  console.log("Worker bind:  ", bindRes);
  const keyValRes = await keyValues.upload(auth, config.namespaceId, bundleFiles);
  console.log("KV upload:    ", keyValRes);
}

export { CloudflareDeployConfig };

export default {
  resetSecrets,
  deploy,
  readBundleFiles,
};
