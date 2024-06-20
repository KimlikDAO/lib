import base58 from "../util/base58";
import "./ipfs.d";

/**
 * Write an integer in the Continue-Bit-Encoding.
 *
 * We support integers up to 21 bits since IPFS block are capped at 16-bit
 * length.
 *
 * @param {!Uint8Array} buff
 * @param {number} n
 */
const writeCBE = (buff, n) => {
  if (n < 128) {
    buff[0] = n;
  } else {
    buff[0] = n & 127 | 128;
    if (n < 16384) {
      buff[1] = n >> 7;
    } else {
      buff[1] = (n >> 7) & 127 | 128;
      buff[2] = (n >> 14);
    }
  }
}

/**
 * @param {!Uint8Array} data Uint8Array olarak dosya
 * @return {!Promise<!Uint8Array>}
 */
const hash = (data) => {
  /** @const {number} */
  const n = data.length;
  // Since IPFS blocks are capped at 2^16 bytes, their length can always be
  // written in 3 7-bit chunks.
  /** @const {number} */
  const nEncodedLen = n < 128 ? 1 : n < 16384 ? 2 : 3;
  /** @const {number} */
  const m = n + 4 + (nEncodedLen << 1);
  /** @const {number} */
  const mEncodedLen = m < 128 ? 1 : m < 16384 ? 2 : 3;
  /** @const {!Uint8Array} */
  const padded = new Uint8Array(1 + mEncodedLen + m);
  padded[0] = 10;
  writeCBE(padded.subarray(1), m);
  padded.set([8, 2, 18], 1 + mEncodedLen);
  writeCBE(padded.subarray(4 + mEncodedLen), n);
  /** @const {number} */
  const dataOffset = 4 + mEncodedLen + nEncodedLen;
  padded.set(data, dataOffset);
  padded[dataOffset + n] = 24;
  padded.set(padded.subarray(4 + mEncodedLen, dataOffset), dataOffset + n + 1);
  return crypto.subtle.digest('SHA-256', padded)
    .then((buff) => new Uint8Array(buff));
}

/**
 * @param {!Uint8Array} hash
 * @return {string} CID
 */
const CID = (hash) => {
  /** @const {!Uint8Array} */
  const bytes = new Uint8Array(34);
  bytes.set([18, 32])
  bytes.set(hash, 2);
  return base58.from(bytes);
}

/**
 * @param {string} nodeUrl
 * @param {!Uint8Array} cidByte
 * @return {!Promise<string>}
 */
const cidBytetanOku = (nodeUrl, cidByte) => {
  /** @const {string} */
  const yerelCID = CID(cidByte);
  return fetch(nodeUrl + "/ipfs/" + yerelCID)
    .then((res) => res.arrayBuffer())
    .then((/** @type {!ArrayBuffer} */ buf) => hash(new Uint8Array(buf))
      .then((gelenByte) => CID(gelenByte) === yerelCID
        ? new TextDecoder().decode(buf)
        : Promise.reject("IPFS hash'i tutmadı"))
    );
}

/**
 * @param {string} nodeUrl
 * @param {string} veri IPFS'e yazılacak veri.
 * @param {string} veriŞekli Yazılacak verinin şekli, mimetype standardında
 * @return {!Promise<!Uint8Array>} onaylanmış IPFS cidByte.
 */
const yaz = (nodeUrl, veri, veriŞekli) => {
  /** @const {!Uint8Array} */
  const encoded = new TextEncoder().encode(veri);
  /** @const {!FormData} */
  const formData = new FormData()
  formData.set("blob", new Blob([encoded], { type: veriŞekli }));
  /** @const {!Promise<string>} */
  const gelenSöz = fetch(nodeUrl + "/api/v0/add", {
    method: "POST",
    body: formData
  })
    .then((res) => res.json())
    .then((/** @type {!node.ipfs.AddResult} */ res) => res.Hash)

  return Promise.all([hash(encoded), gelenSöz])
    .then(([/** !Uint8Array */ yerel, /** string */ gelen]) => CID(yerel) == gelen
      ? yerel
      : Promise.reject(`IPFS'ten farklı sonuç döndü. Yerel: ${CID(yerel)}, Gelen: ${gelen}`)
    )
}

export default {
  CID,
  cidBytetanOku,
  hash,
  yaz,
};
