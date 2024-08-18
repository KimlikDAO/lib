import { compareImpls } from "../../testing/bench";
import { base64, base64ten } from "../çevir";

const base64_2 = (b) => btoa([...b].map((x) => String.fromCharCode(x)).join(""));

const base64_3 = (bytes) => btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""));

/** @const {string} */
const output = "U29tZSBiYXNlNjQgZGF0YS4=";
/** @const {!Uint8Array} */
const input = base64ten(output);

compareImpls([base64_2, base64, base64_3], 1000, [input], output);
