/**
 * @fileoverview A stub for interacting with the KimlikDAO protocol network.
 *
 * @author KimlikDAO
 */

import "../did/section.d";

/** @const {!Array<string>} */
const SEED_NODES = [
  "node.kimlikdao.org",
  "kdao-node.blinkbridge.xyz",
  "kdao-node.yenibank.com",
  "kdao-node.lstcm.co",
  "kdao-node.dobbyinu.com",
  "kdao-node.yenilira.org",
  "kdao-node.kopru.xyz",
];

/**
 * Poll the network to sample nodes uniformly at random.
 *
 * FIX(KimlikDAO-bot): For now, we just return the hardcoded seed nodes.
 *
 * @param {number} numNodes
 * @return {!Promise<!Array<string>>}
 */
const getNodes = (numNodes) => Promise.resolve(SEED_NODES);

/**
 * Poll the network and return the median PoW threshold.
 *
 * FIX(KimlikDAO-bot): Acutally poll the network.
 *
 * @return {!Promise<number>}
 */
const getPoWThreshold = () => Promise.resolve(20_000);

/** @const */
const nko = {
  /**
   * @param {string} commitmentPow
   * @return {!Promise<string>}
   */
  getPDFCommitment(commitmentPow) {
    return fetch(`//${SEED_NODES[0]}/edevlet/nko/commit?${commitmentPow}`)
      .then((res) => res.text())
      .catch(console.log);
  },

  /**
   * @param {string} commitmentPow
   * @param {!FormData} pdfFormData
   * @param {number} clientTime
   * @param {number} numSigners
   * @return {!Promise<!Array<!did.DecryptedSections>>}
   */
  getCredentialsFromPDF(commitmentPow, pdfFormData, clientTime, numSigners) {
    return Promise.allSettled(SEED_NODES
      .slice(0, numSigners)
      .map((node) =>
        fetch(`//${node}/edevlet/nko?${commitmentPow}&ts=${clientTime}`, {
          method: "POST",
          body: pdfFormData
        }).then((/** @type {!Response} */ res) => res.json()
          .then((data) => res.ok && data ? data : Promise.reject(data))
        ))
    ).then((/** @type {!Array<!Promise.AllSettledResultElement<!did.DecryptedSections>>} */
      results) => results
        .filter((result) => result.status == "fulfilled")
        .map((result) => result.value)
    );
  }
}

export default {
  getNodes,
  getPoWThreshold,
  nko,
};
