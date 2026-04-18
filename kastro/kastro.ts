import { file, serve } from "bun";
import process from "node:process";
import { CliArgs } from "../util/cli";
import { fromTarget } from "./compiler/bundleReport";
import compiler from "./compiler/compiler";
import { getPageTargets, setupKastro } from "./compiler/crate";
import { Target } from "./compiler/target";
import { Props } from "./props";
import { CompressedMimes, Mimes } from "./workers/mimes";

const PAGE_CACHE_CONTROL: string = "no-cache";
const STATIC_CACHE_CONTROL: string = "max-age=29000000,public,immutable,no-transform";

const serveCrate = async (crateName: string, { BuildMode }: Props) => {
  setupKastro();
  const map = getPageTargets(await import(crateName), { BuildMode });
  serve({
    async fetch(req: Request) {
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
        await compiler.bundleTarget(maybeTarget.targetName!, maybeTarget);
      const filePath = `build/bundle/${resolvedPath + ext.slice(0, 3)}`;
      console.info("Serving:", filePath);
      const arrBuff = await file(filePath)
        .arrayBuffer();
      const headers: Record<string, string> = {
        "cache-control": dot == -1 ? PAGE_CACHE_CONTROL : STATIC_CACHE_CONTROL,
        "content-type": dot == -1 ? "text/html;charset=utf-8" : Mimes[suffix],
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

const buildCrate = (crateName: string, { BuildMode }: Props): Promise<Target> => {
  setupKastro();
  return import(crateName).then((crate) =>
    compiler.buildTarget(`/build${crateName.slice(0, -3)}.c.json`, {
      dynamicDeps: true,
      BuildMode,
      data: crate
    })
  );
}

const deployCrate = async (
  crateName: string,
  { targetName = "cloudflare", ...props }: Props
) => {
  const [{ default: deployer }, crateTarget, config] = await Promise.all([
    import(`@kimlikdao/kastro/${targetName}/${targetName}`),
    buildCrate(crateName, props),
    import("/deployerConfig")
  ]);
  return deployer.deploy(fromTarget(crateTarget), config.default[targetName]);
}

const args = CliArgs.fromArgv(process.argv, "command", {});
const [command, crate = ""] = args.asList("command");
const crateName = `${crate}/mpa`;

const BuildMode = args.isTrue("release")
  ? compiler.BuildMode.Release
  : args.isTrue("compiled")
    ? compiler.BuildMode.Compiled
    : compiler.BuildMode.Dev;

switch (command) {
  case "serve":
    serveCrate(crateName, { BuildMode }); break;
  case "build":
    buildCrate(crateName, { BuildMode }); break;
  case "deploy":
    deployCrate(crateName, { BuildMode: compiler.BuildMode.Release }); break;
  case "reset":
    import("./cloudflare/cloudflare")
      .then(({ default: cloudflare }) => cloudflare.resetSecrets()); break;
}
