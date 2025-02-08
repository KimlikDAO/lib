/**
 * @fileoverview
 *
 * @author KimlikDAO
 */

/**
 * @const
 */
const jsonrpc = {};

/**
 * @typedef {{
 *   jsonrpc: string,
 *   method: string,
 *   params: Array<*>,
 *   id: (number|string)
 * }}
 */
jsonrpc.Request;

/**
 * @typedef {{
 *   jsonrpc: string,
 *   result: *,
 *   error: *,
 *   id: (number|string)
 * }}
 */
jsonrpc.Response;
