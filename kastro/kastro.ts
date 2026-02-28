import { file, serve } from "bun";
import process from "node:process";
import { parseArgs } from "../util/cli";
import compiler from "./compiler/compiler";
import { getPageTargets, setupKastro } from "./compiler/crate";
import { Props } from "./props";
import { CompressedMimes, Mimes } from "./workers/mimes";
import { Target } from "./compiler/target";

const PAGE_CACHE_CONTROL: string = "no-cache";
const STATIC_CACHE_CONTROL: string = "max-age=29000000,public,immutable,no-transform";

const serveCrate = async (crateName: string, { BuildMode }: Props) => {
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

const buildCrate = async (crateName: string, { BuildMode }: Props): Promise<Target> => {
  setupKastro();
  const crate = await import(crateName);
  return compiler.buildTarget(`/build${crateName.slice(0, -3)}.c.json`, {
    dynamicDeps: true,
    BuildMode,
    crate
  });
}

const deployCrate = async (crateName: string, props: Props) => {
  const [_auth, crateTarget] = await Promise.all([
    import(`${process.cwd()}/.secrets.js`),
    buildCrate(crateName, props)
  ]);
  throw `Not implemented ${crateTarget}`;
}

const args = parseArgs((process as NodeJS.Process).argv.slice(2), "command");
const crateName = (Array.isArray(args["command"]) ? args["command"][1] : "")
  + "/mpa.js";
const BuildMode = (args["release"] as boolean)
  ? compiler.BuildMode.Release
  : (args["compiled"] as boolean) ? compiler.BuildMode.Compiled : compiler.BuildMode.Dev;

switch (args["command"] as string) {
  case "serve":
    serveCrate(crateName, { BuildMode }); break;
  case "build":
    buildCrate(crateName, { BuildMode }); break;
  case "deploy":
    deployCrate(crateName, { BuildMode }); break;
}
