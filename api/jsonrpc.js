import { RpcRequest, RpcResponse } from "./jsonrpc.d";

/** @const {!Object<string, string>} */
const HEADERS = { "content-type": "application/json" };

/**
 * @param {string} url
 * @param {string} method
 * @param {!Array<*>} params
 * @return {!Promise<?>}
 */
const call = (url, method, params) => fetch(url, {
  method: "POST",
  headers: HEADERS,
  body: JSON.stringify(/** @type {!RpcRequest} */({
    jsonrpc: "2.0",
    id: 1,
    method,
    params
  }))
}).then((res) => res.ok ? res.json() : Promise.reject(res.statusText))
  .then((/** @type {!RpcResponse} */ res) =>
    res.result || Promise.reject(res.error));

/**
 * @param {string} url
 * @param {string} method
 * @param {!Array<!Array<*>>} paramsList
 * @return {!Promise<!Array<*>>}
 */
const callMulti = (url, method, paramsList) => {
  /** @const {string} */
  const body = JSON.stringify(/** @type {!Array<!RpcRequest>} */(
    paramsList.map((params, idx) => /** @type {!RpcRequest} */({
      jsonrpc: "2.0",
      id: idx + 1,
      method,
      params
    }))
  ));
  return fetch(url, {
    method: "POST",
    headers: HEADERS,
    body
  }).then((res) => res.ok
    ? res.json()
    : Promise.reject(res.statusText)
  ).then((/** @type {!Array<!RpcResponse>} */ items) => items
    .sort((i1, i2) => +i1.id - +i2.id)
    .map((item) => item.result)
  );
}

export default { call, callMulti };
