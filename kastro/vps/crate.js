import { spawn } from "bun";
import cache from "../cloudflare/cache";
import { restart } from "./service";

const deploy = async (crateName, secrets, namedAssets) => {
  const {
    host,
    username,
    remotePath,
    sshKey,
  } = secrets.VpsConfig;
  /** @const {string} */
  const target = `[${host}]:${remotePath}/crate`;

  try {
    const rsync = spawn([
      "rsync",
      "-rP",
      "-e", `ssh -6 -i ${sshKey} -l ${username}`,
      "./build/bundle/",
      target
    ]);
    const deployOutput = await new Response(rsync.stdout).text();
    console.log("Deploy successful:", deployOutput);
  } catch (error) {
    console.error("Deploy failed:", error);
    throw error;
  }
  return restart(secrets)
    .then(() => cache.purge(crateName, secrets, Object.keys(namedAssets)));
}

export { deploy };
