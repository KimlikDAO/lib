import { compile } from "../../kdjs/compile";

/**
 * @param {string} worker
 * @return {!Promise<string>}
 */
const build = (worker) => compile({
  "entry": worker,
  "nologs": true,
  "output": "build/" + worker
})

const deployToCloudflare = () => { }
