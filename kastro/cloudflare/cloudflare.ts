
import compiler from "../compiler/compiler";
import { BundleReport, getEtags } from "../compiler/bundleReport";

const deploy = (
  bundleReport: BundleReport,
  _config: { zoneId: string, workerName: string }
) => {
  compiler.buildTarget("/build/bundledWorker.js", {
    dynamicDeps: true,
    src: "lib/kastro/cloudflare/bundledWorker.ts", // TODO(): Do not hardcode /lib
    BuildMode: compiler.BuildMode.Release,
    globals: {
      HOST_URL: bundleReport.hostUrl,
      ETAGS: getEtags(bundleReport)
    },
    print: true,
  }).then((target) => {
    console.log(target);
  });
}

export default { deploy };
