/**
 * @fileoverview JSON-RPC 2.0 type definitions.
 *
 * @author KimlikDAO
 */

interface Request {
  readonly jsonrpc: string;
  readonly method: string;
  readonly params: unknown[];
  readonly id: number | string;
}

interface Response {
  readonly jsonrpc: string;
  readonly result: unknown;
  readonly error: unknown;
  readonly id: number | string;
}

export default { Request, Response };
