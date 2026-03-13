/**
 * @fileoverview Errors returned from a KimlikDAO protocol node.
 *
 * @author KimlikDAO
 */

import { ErrorMessage } from "./error.d";

const reject = (code: number, messages?: string[]): Promise<never> =>
  Promise.reject({ code, messages } as ErrorMessage);

const HEADERS: Record<string, string> = {
  "content-type": "application/json;charset=utf-8",
  "access-control-allow-origin": "*",
  "cache-control": "private,no-cache",
};

const errorResponse = (httpStatus: number, errorMessage: ErrorMessage): Response =>
  new Response(
    JSON.stringify(errorMessage),
    { status: httpStatus, headers: HEADERS }
  );

const err = (httpStatus: number, errorCode: number): Response =>
  errorResponse(httpStatus, { code: errorCode, messages: [] } as ErrorMessage);

const errWithMessage = (
  httpStatus: number,
  errorCode: number,
  messages: string[]
): Response =>
  errorResponse(httpStatus, { code: errorCode, messages } as ErrorMessage);

export {
  err,
  errorResponse,
  errWithMessage,
  reject,
};
