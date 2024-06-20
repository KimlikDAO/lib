/**
 * @fileoverview Errors returned from a KimlikDAO protocol node.
 *
 * @author KimlikDAO
 */

import "./error.d";

/** @enum {number} */
const ErrorCode = {
  DOCUMENT_EXPIRED: 0,
  INVALID_RECORD: 1,
  INCORRECT_INSTITUTION: 2,
  PERSON_NOT_ALIVE: 3,
  INVALID_CHALLENGE: 4,
  AUTHENTICATION_FAILURE: 5,
  INVALID_POW: 6,
  INCORRECT_FILE_FORMAT: 7,
  INVALID_TIMESTAMP: 8,
  INVALID_REQUEST: 9
};

/**
 * @param {!ErrorCode} kod
 * @param {!Array<string>=} ek
 * @return {!Promise<*>}
 */
const reject = (kod, ek) =>
  Promise.reject(/** @type {!node.HataBildirimi} */({ kod, ek }));

/** @const {!Object<string, string>} */
const HEADERS = {
  'content-type': 'application/json;charset=utf-8',
  'access-control-allow-origin': "*",
  'cache-control': 'private,no-cache',
};

/**
 * @param {number} httpStatus
 * @param {!ErrorCode} errorCode
 * @return {!Response}
 */
const err = (httpStatus, errorCode) => errorResponse(
  httpStatus,
  /** @type {!node.HataBildirimi} */({ kod: errorCode })
);

/**
 * @param {number} httpStatus
 * @param {!ErrorCode} errorCode
 * @param {!Array<string>} messages
 * @return {!Response}
 */
const errWithMessage = (httpStatus, errorCode, messages) => errorResponse(
  httpStatus,
  /** @type {!node.HataBildirimi} */({ kod: errorCode, ek: messages })
);

/**
 * @param {number} httpStatus
 * @param {!node.HataBildirimi} hataBildirimi
 * @return {!Response}
 */
const errorResponse = (httpStatus, hataBildirimi) => new Response(
  JSON.stringify(hataBildirimi),
  { status: httpStatus, headers: HEADERS }
);

export {
  err,
  ErrorCode,
  errorResponse,
  errWithMessage,
  reject
};
