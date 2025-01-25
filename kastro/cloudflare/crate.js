import { readdir, readFile } from "node:fs/promises";
import compiler from "../compiler/compiler";
import { Auth } from "./api";
import workers from "./workers";

/**
 * @param {string} crateName
 * @param {{ CloudflareAuth: Auth }} secrets
 * @param {!Object<string, string>} namedAssets
 */
const deploy = (crateName, secrets, namedAssets) => import(crateName)
  .then((crate) => {
    /** @const {!Object<string, string>} */
    const etags = {};
    for (const name of namedAssets)
      etags[name] = `"${namedAssets[name]}"`;

    /** @const {string} */
    const crateDir = "build/crate/";
    return Promise.all([
      compiler.buildTarget("/build/bundledPageWorker.js", {
        dynamicDeps: true,
        src: "lib/kastro/cloudflare/bundledPageWorker.js",
        BuildMode: compiler.BuildMode.Release,
        globals: {
          HOST_URL: crate.HostUrl,
          ETAGS: etags
        }
      }),
      readdir(crateDir)
        .then((files) => Promise.all(files.map((file) => readFile(crateDir + "/" + file)
          .then((content) => [file, content])))
          .then(Object.fromEntries))
    ]).then(([{ content }, files]) =>
      workers.upload(secrets.CloudflareAuth, "dapp", content.buffer, [], files));
  });

export { deploy };
