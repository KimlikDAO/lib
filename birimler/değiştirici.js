import { readFileSync, writeFileSync } from "node:fs";
import process from "process";

/**
 * @param {string} text
 * @param {!Object<string, string>} replace
 * @return {string}
 */
const multireplace = (text, replace) => text.replace(
  new RegExp(Object.keys(replace).join("|"), "gi"),
  (match) => replace[match]
);

const keymap = (filePath) => {
  /** @const {string} */
  const fileContent = readFileSync(filePath, "utf8");
  /** @const {!Array<!Array<string>>} */
  const entries = fileContent
    .split("\n")
    .filter((line) => line.includes("->"))
    .map((line) => line.split("->").map((part) => part.trim()));
  return Object.fromEntries(entries);
};

/**
 * @const {!Object<string, string>}
 */
const Replace = {
  ',{type:"module"}': "",
};

/** @const {!Array<string>} */
const args = process.argv.slice(2);

let outFile = args[0];
if (args.length >= 3 && args[args.length - 2] === "-o") {
  outFile = args.pop();
  args.pop();
}

for (const name of args.slice(1))
  Object.assign(Replace, keymap(name));

console.log("Şu kurallara göre güncellenecek:", Replace);
writeFileSync(outFile, multireplace(readFileSync(args[0], "utf8"), Replace));
