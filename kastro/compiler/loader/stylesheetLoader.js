import { StyleSheet } from "@kimlikdao/lib/kastro/compiler/stylesheet";
import { parse } from "css";
import { readFile } from 'node:fs/promises';

/** @define {string} */
const Source = "SOURCE";

const ExportedStyleSheet = (props) => StyleSheet({ ...props, src: Source });

const extractIdentifiers = () => readFile(Source, "utf-8")
  .then((cssContent) => {
    const parsedCss = parse(cssContent);
    const processRules = (rules) => {
      rules.forEach(rule => {
        if (rule.type === "rule") {
          rule.selectors.forEach(selector => {
            // Extract class names and IDs
            const matches = selector.match(/[.#][a-zA-Z_-][a-zA-Z0-9_-]*/g);
            if (matches)
              matches.forEach((match) =>
                ExportedStyleSheet[match.replace("#", "$").replace(".", "")] = match.slice(1));
          });
        } else if (rule.type === "media" || rule.type === "supports")
          processRules(rule.rules);
      });
    };

    processRules(parsedCss.stylesheet.rules);
  });

await extractIdentifiers();

console.log(Object.getOwnPropertyNames(ExportedStyleSheet).reduce((acc, prop) => {
  acc[prop] = ExportedStyleSheet[prop];
  return acc;
}, {}));

export default ExportedStyleSheet;
