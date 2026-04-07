import base58 from "../../util/base58";
import type { AddResult } from "./ipfs.d";

/**
 * Write an integer in the Continue-Bit-Encoding.
 * We support integers up to 21 bits since IPFS blocks are capped at 16-bit length.
 *
 * @satisfies {InPlaceFn}
 */
const writeCBE = (buff: Uint8Array, n: number): void => {
  if (n < 128) {
    buff[0] = n;
  } else {
    buff[0] = n & 127 | 128;
    if (n < 16384) {
      buff[1] = n >> 7;
    } else {
      buff[1] = (n >> 7) & 127 | 128;
      buff[2] = n >> 14;
    }
  }
};

/** @satisfies {PureFn} */
const hash = (data: Uint8Array): Promise<Uint8Array> => {
  const n = data.length;
  const nEncodedLen = n < 128 ? 1 : n < 16384 ? 2 : 3;
  const m = n + 4 + (nEncodedLen << 1);
  const mEncodedLen = m < 128 ? 1 : m < 16384 ? 2 : 3;
  const padded = new Uint8Array(1 + mEncodedLen + m);
  padded[0] = 10;
  writeCBE(padded.subarray(1), m);
  padded.set([8, 2, 18], 1 + mEncodedLen);
  writeCBE(padded.subarray(4 + mEncodedLen), n);
  const dataOffset = 4 + mEncodedLen + nEncodedLen;
  padded.set(data, dataOffset);
  padded[dataOffset + n] = 24;
  padded.set(padded.subarray(4 + mEncodedLen, dataOffset), dataOffset + n + 1);
  return crypto.subtle.digest("SHA-256", padded)
    .then((buff) => new Uint8Array(buff));
};

/** @satisfies {PureFn} */
const CID = (hash: Uint8Array): string => {
  const bytes = new Uint8Array(34);
  bytes.set([18, 32]);
  bytes.set(hash, 2);
  return base58.from(bytes);
};

const readWithCIDBytes = (nodeUrl: string, cidByte: Uint8Array): Promise<string> => {
  const localCID = CID(cidByte);
  return fetch(nodeUrl + "/ipfs/" + localCID)
    .then((res) => res.arrayBuffer())
    .then((buf: ArrayBuffer) => hash(new Uint8Array(buf))
      .then((gelenByte) => CID(gelenByte) == localCID
        ? new TextDecoder().decode(buf)
        : Promise.reject("IPFS hash mismatch")));
};

const write = (nodeUrl: string, data: string, dataType: string): Promise<Uint8Array> => {
  const encoded = new TextEncoder().encode(data);
  const formData = new FormData();
  formData.set("blob", new Blob([encoded], { type: dataType }));
  const remoteHashPromise = fetch(nodeUrl + "/api/v0/add", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((res: AddResult) => res.Hash);

  return Promise.all([hash(encoded), remoteHashPromise])
    .then(([local, remote]) => CID(local) == remote
      ? local
      : Promise.reject(`IPFS hash mismatch. Local: ${CID(local)}, Remote: ${remote}`));
};

export default {
  CID,
  readWithCIDBytes,
  hash,
  write,
};
