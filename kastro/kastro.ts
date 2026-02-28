import { file, serve } from "bun";
import process from "node:process";
import { parseArgs } from "../util/cli";
import compiler from "./compiler/compiler";
import { getPageTargets, setupKastro } from "./compiler/crate";
import { CompressedMimes, Mimes } from "./workers/mimes";

const PAGE_CACHE_CONTROL: string = "no-cache";
const STATIC_CACHE_CONTROL: string = "max-age=29000000,public,immutable,no-transform";

const serveCrate = async (crateName: string, { BuildMode }: { BuildMode: number }) => {
  setupKastro();
  const map = getPageTargets(await import(crateName), BuildMode);
  serve({
    async fetch(req) {
      const path = new URL(req.url).pathname.slice(1);
      const dot = path.indexOf(".");
      const suffix = path.slice(dot + 1);
      const enc = req.headers.get("accept-encoding") || "";
      const ext = (dot != -1 && CompressedMimes[suffix])
        ? ""
        : enc.includes("br") ? ".br" : enc.includes("gz") ? ".gzip" : "";
      let resolvedPath = path;
      if (!path) {
        const cookie = req.headers.get("cookie")
        const leq = cookie ? cookie.indexOf("l=") : -1;
        resolvedPath = (leq != -1)
          ? (cookie as string).slice(leq + 2, leq + 4)
          : req.headers.get("accept-language")
            ?.includes("tr") ? "tr" : "en"
      }
      const maybeTarget = map[resolvedPath];
      if (maybeTarget)
        await compiler.bundleTarget(maybeTarget.targetName, maybeTarget);
      const filePath = `build/bundle/${resolvedPath + ext.slice(0, 3)}`;
      console.info("Serving:", filePath);
      const arrBuff = await file(filePath)
        .arrayBuffer();
      const headers: Record<string, string> = {
        "cache-control": dot == -1 ? PAGE_CACHE_CONTROL : STATIC_CACHE_CONTROL,
        "content-type": dot == -1 ? "text/html;charset=utf-8" : (Mimes[suffix] as string),
        "content-length": "" + arrBuff.byteLength,
        "expires": "Sun, 01 Jan 2034 00:00:00 GMT",
        "vary": path ? "accept-encoding" : "accept-encoding,cookie"
      };
      if (ext)
        headers["content-encoding"] = ext.slice(1);
      if (suffix == "woff2" || suffix == "ttf")
        headers["access-control-allow-origin"] = "*";
      return new Response(arrBuff, { headers });
    }
  });
  console.log("Serve at http://localhost:3000");
}

const deployCrate = (crateName: string, _targetName: string) => {
  console.log(crateName);
  /*
  Promise.all([
    compiler.buildTarget(crateName, compiler.BuildMode.Compiled),
    import(`${process.cwd()}/.secrets.js`),
    import(`./${targetName}/crate.js`)
  ])
    .then(([_, secrets, crateDeployer]) =>
      crateDeployer.deploy(crateName, secrets, compiler.getNamedAssets()));
  */
}

const args = parseArgs((process as NodeJS.Process).argv.slice(2), "command");
const crateName = (Array.isArray(args["command"]) ? args["command"][1] : "")
  + "/crate.js";

if (args["command"] == "serve")
  serveCrate(crateName, { BuildMode: compiler.BuildMode.Release });
else if (args["command"] == "deploy")
  deployCrate(crateName, (args["target"] as string) || "cloudflare")
