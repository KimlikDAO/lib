/**
 * @fileoverview A stub for interacting with the KimlikDAO protocol network.
 *
 * @author KimlikDAO
 */

/**
 * Poll the network to sample nodes uniformly at random.
 *
 * FIX(KimlikDAO-bot): For now, we just return the hardcoded seed nodes.
 *
 * @param {number} numNodes
 * @return {!Promise<!Array<string>>}
 */
const getNodes = (numNodes) => Promise.resolve([
  "node.kimlikdao.org",
  "kdao-node.yenibank.org",
  "kdao-node.lstcm.co",
  "kdao-node.dobbyinu.com",
  "kdao-node.yenilira.org",
  "kdao-node.kopru.xyz",
  "kdao-node.timedogankoy.com",
]);

/**
 * Poll the network and return the median PoW threshold.
 *
 * FIX(KimlikDAO-bot): Acutally poll the network.
 *
 * @return {!Promise<number>}
 */
const getPoWThreshold = () => Promise.resolve(20_000);

export default {
  getNodes,
  getPoWThreshold,
};
