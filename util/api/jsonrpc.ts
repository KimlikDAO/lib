import { RpcRequest, RpcResponse } from "./jsonrpc.d";

const HEADERS: Record<string, string> = { "content-type": "application/json" };

const call = (
  url: string,
  method: string,
  params: unknown[]
): Promise<any> => fetch(url, {
  method: "POST",
  headers: HEADERS,
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method,
    params
  } as RpcRequest)
}).then((res: Response) => res.ok ? res.json() : Promise.reject(res.statusText))
  .then((res: RpcResponse) =>
    res.result || Promise.reject(res.error)
  );

const callMulti = (
  url: string,
  method: string,
  paramsList: unknown[][]
): Promise<any[]> => {
  const body = JSON.stringify(
    paramsList.map((params, idx) => ({
      jsonrpc: "2.0",
      id: idx + 1,
      method,
      params
    } as RpcRequest))
  );
  return fetch(url, {
    method: "POST",
    headers: HEADERS,
    body
  }).then((res) => res.ok
    ? res.json()
    : Promise.reject(res.statusText)
  ).then((items: RpcResponse[]) => items
    .sort((i1: RpcResponse, i2: RpcResponse) => +i1.id - +i2.id)
    .map((item: RpcResponse) => item.result)
  );
}

export default { call, callMulti };
