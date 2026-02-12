import { describe, expect, test } from "bun:test";
import process from "node:process";
import { wait } from "../../../util/promises";
import { Auth } from "../api";
import workers from "../workers";

/**
 * @return {Promise<Auth>}
 */
const getAuth = () => {
  /** @const {Auth} */
  const auth = {
    accountId: process.env["CF_TESTING_ACCOUNT_ID"],
    zoneId: "",
    token: process.env["CF_TESTING_API_TOKEN"],
  };

  const secrets = process.cwd() + "/.secrets.js";
  return auth.accountId
    ? Promise.resolve(auth)
    : import(secrets)
      .then((mod) => /** @type {Auth} */(mod["CloudflareAuth"]))
      .catch(() => /** @type {Auth} */({ accountId: "", token: "" }));
}

describe("Tests with Cloudflare auth", async () => {
  const auth = await getAuth();

  test.if(!!auth.accountId)("upload, fetch and delete worker", async () => {
    /** @const {string} */
    const name = `test-worker-${Math.floor(1000 + Math.random() * 9000)}`;
    /** @const {string} */
    const code = `export default {fetch(){return new Response("${name}",{headers:{"content-type":"text/plain"}})}}`;

    const uploadResult = await workers.upload(auth, name, code, []);
    expect(uploadResult.success).toBeTrue();

    const workersDevResult = await workers.enableWorkersDev(auth, name);
    expect(workersDevResult.success).toBeTrue();

    const maxAttempts = 5;
    let attempt = 0;
    for (; attempt < maxAttempts; ++attempt) {
      await wait(5000);
      try {
        const fetchResult = await fetch(`https://${name}.kimlikdao-testing.workers.dev`);
        if (fetchResult.status == 200) {
          const text = await fetchResult.text();
          expect(text).toBe(name);
          break;
        }
      } catch (_) { }
    }
    await workers.delete(auth, name);
    expect(attempt).toBeLessThan(maxAttempts);
  }, {
    timeout: 15_000
  });
});
