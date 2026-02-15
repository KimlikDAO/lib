import { expect, test } from "bun:test";
import hex from "../../util/hex";
import { hash } from "../section";
import { ExposureReport } from "../section.d";

test("hash ExposureReport", () => {
  const buff = new Uint8Array(32);
  buff[31] = buff[30] = buff[29] = 123;
  expect(hash("exposureReport", /** @type {ExposureReport} */({
    id: hex.from(buff),
    signatureTs: 123
  })))
    .toBe("43eadff4f6142463dc8d8a271e14406c9b11b166b704c846dcd705439bf321f9");
});

test("hash ExposureReport", () => {
  const buff = new Uint8Array(32);
  buff[31] = buff[30] = buff[29] = buff[28] = 170;
  expect(hash("exposureReport", /** @const {ExposureReport} */({
    id: hex.from(buff),
    signatureTs: 123
  })))
    .toBe("396f822b3d8cef6a211a07d8147540acf33bedf67417277245dac8e04d5ec31d");
});

test("hash ExposureReport", () => {
  const buff = new Uint8Array(32);
  buff[31] = buff[30] = buff[29] = buff[28] = 170;
  expect(hash("exposureReport", /** @const {ExposureReport} */({
    id: hex.from(buff),
    signatureTs: 123123123123
  })))
    .toBe("0a9a3c0c8d1fa507641e0bab6d90adee12cb6a6efa544da55b5ca76b326f1740");
});
