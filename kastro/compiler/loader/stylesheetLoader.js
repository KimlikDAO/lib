import { StyleSheet } from "@kimlikdao/lib/kastro/compiler/stylesheet";
import { parse } from "css";
import { readFileSync } from "node:fs";

/** @define {string} */
const Source = "SOURCE";

const ExportedStyleSheet = (props) => StyleSheet({ ...props, src: Source });

const extractIdentifiers = () => {
  const cssContent = readFileSync(Source, "utf-8");
  const parsedCss = parse(cssContent);
  const rulesStack = [parsedCss.stylesheet.rules];

  for (let rules; rules = rulesStack.pop();)
    rules.forEach((rule) => {
      if (rule.type === "rule") {
        rule.selectors.forEach((selector) => {
          const matches = selector.match(/[.#][a-zA-Z_-][a-zA-Z0-9_-]*/g);
          if (matches)
            matches.forEach((match) =>
              ExportedStyleSheet[match.replace("#", "$").replace(".", "")] = match.slice(1));
        });
      } else if (rule.type === "media" || rule.type === "supports")
        rulesStack.push(rule.rules);
    });
};

extractIdentifiers();

export default ExportedStyleSheet;
