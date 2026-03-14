/**
 * @fileoverview JSON-RPC 2.0 type definitions.
 *
 * @author KimlikDAO
 */

interface RpcRequest {
  readonly jsonrpc: string;
  readonly method: string;
  readonly params: unknown[];
  readonly id: number | string;
}

interface RpcResponse {
  readonly jsonrpc: string;
  readonly result: unknown;
  readonly error: unknown;
  readonly id: number | string;
}

export { RpcRequest, RpcResponse };
