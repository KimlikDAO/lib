/**
 * @fileoverview Errors returned from a KimlikDAO protocol node.
 *
 * @author KimlikDAO
 */

import "../error.d";

/**
 * @param {number} code
 * @param {string[]=} messages
 * @return {Promise<unknown>}
 */
const reject = (code, messages) =>
  Promise.reject(/** @type {protocol.ErrorMessage} */({ code, messages }));

/** @const {Record<string, string>} */
const HEADERS = {
  "content-type": "application/json;charset=utf-8",
  "access-control-allow-origin": "*",
  "cache-control": "private,no-cache",
};

/**
 * @param {number} httpStatus
 * @param {ErrorCode} errorCode
 * @return {Response}
 */
const err = (httpStatus, errorCode) => errorResponse(
  httpStatus,
  /** @type {protocol.ErrorMessage} */({ code: errorCode })
);

/**
 * @param {number} httpStatus
 * @param {ErrorCode} errorCode
 * @param {string[]} messages
 * @return {Response}
 */
const errWithMessage = (httpStatus, errorCode, messages) => errorResponse(
  httpStatus,
  /** @type {protocol.ErrorMessage} */({ code: errorCode, messages })
);

/**
 * @param {number} httpStatus
 * @param {protocol.ErrorMessage} errorMessage
 * @return {Response}
 */
const errorResponse = (httpStatus, errorMessage) => new Response(
  JSON.stringify(errorMessage),
  { status: httpStatus, headers: HEADERS }
);

export {
  err,
  errorResponse,
  errWithMessage,
  reject
};
