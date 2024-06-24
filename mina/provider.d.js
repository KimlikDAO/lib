/**
 * @externs
 * @author KimlikDAO
 */

import mina from "./mina.d";

/**
 * @typedef {{
 *   networkID: string
 * }}
 */
mina.SwitchChainArgs;

/**
 * @typedef {{
 *   networkID: string,
 *   name: string
 * }}
 */
mina.ChainInfoArgs;

/**
 * @typedef {{
 *   message: string
 * }}
 */
mina.SignMessageArgs;

/**
 * @typedef {{
 *   publicKey: string,
 *   data: string,
 *   signature: {
 *     field: string,
 *     scalar: string,
 *   }
 * }}
 */
mina.SignedData;

/**
 * @typedef {{
 *   message: string,
 *   code: number,
 *   data: ?
 * }}
 */
mina.ProviderError;

/**
 * @typedef {{
 *   label: string,
 *   value: string
 * }}
 */
mina.JsonMessageData;

/**
 * @typedef {{
 *   message: !Array<!mina.JsonMessageData>
 * }}
 */
mina.SignJsonMessageArgs;

/**
 * @typedef {{
 *   onlySign: (boolean|undefined),
 *   transaction: (string|Object),
 *   feePayer: ({
 *     fee: number,
 *     memo: (string|undefined)
 *   }|undefined)
 * }}
 */
mina.SendTransactionArgs;

/**
 * @typedef {{
 *   hash: string,
 * }}
 */
mina.SendTransactionHash;

/**
 * @typedef {{
 *   signedData: string,
 * }}
 */
mina.SignedZkappCommand;

/**
 * @typedef {!mina.SendTransactionHash | !mina.SignedZkappCommand}
 */
mina.SendZkTransactionResult;

/**
 * @interface
 */
mina.Provider = function () { }

/**
 * @return {!Promise<!Array<string>>}
 */
mina.Provider.prototype.getAccounts = function () { };

/**
 * @return {!Promise<!Array<string>>}
 */
mina.Provider.prototype.requestAccounts = function () { };

/**
 * @return {!Promise<!mina.ChainInfoArgs>}
 */
mina.Provider.prototype.requestNetwork = function () { };

/**
 * @param {!mina.SignMessageArgs} signMessageArgs
 * @return {!Promise<!mina.SignedData>}
 */
mina.Provider.prototype.signMessage = function (signMessageArgs) { };

/**
 * @param {!mina.SwitchChainArgs} switchChainArgs
 * @return {!Promise<!mina.ChainInfoArgs>}
 */
mina.Provider.prototype.switchChain = function (switchChainArgs) { };

/**
 * @param {!mina.SignJsonMessageArgs} jsonMessage
 * @return {!Promise<!mina.SignedData>}
 */
mina.Provider.prototype.signJsonMessage = function (jsonMessage) { };

/**
 * @param {!mina.SendTransactionArgs} sendTransactionArgs
 * @return {!Promise<!mina.SendZkTransactionResult>}
 */
mina.Provider.prototype.sendTransaction = function (sendTransactionArgs) { };

/**
 * @param {string} eventName
 * @param {function(?)} handler
 */
mina.Provider.prototype.on = function (eventName, handler) { };
