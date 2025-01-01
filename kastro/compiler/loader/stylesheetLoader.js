import { StyleSheet } from "@kimlikdao/lib/kastro/stylesheet";
import { parse } from "css";
import { readFileSync } from "node:fs";

/** @define {string} */
const Source = "SOURCE";

const ExportedStyleSheet = (props) => StyleSheet({ ...props, src: Source });

const extractIdentifiers = () => {
  const cssContent = readFileSync(Source, "utf-8");
  const parsedCss = parse(cssContent);
  const rulesStack = [parsedCss.stylesheet.rules];

  for (let rules; rules = rulesStack.pop();) {
    let maybeNamed;
    for (const rule of rules) {
      if (rule.type == "comment") {
        const matches = rule.comment.match(/@(?:export|name)\s*{(.*)}/);
        if (matches) maybeNamed = matches[1].trim();
      } else if (rule.type == "rule") {
        if (maybeNamed) {
          if (rule.selectors.length != 1 || rule.selectors[0].includes(" "))
            throw `Named or exported selectors must be singletons. Violating rule: ${rule.position.content}`;
          ExportedStyleSheet[maybeNamed] = rule.selectors[0].slice(1);
        }
        for (const selector of rule.selectors) {
          if ((selector.startsWith(".") || selector.startsWith("#")) && !selector.match(/[>.: ]/))
            ExportedStyleSheet[selector.replace("#", "$").replace(".", "")] = selector.slice(1);
        }
        maybeNamed = null;
      } else if (rule.type == "media" || rule.type == "supports")
        rulesStack.push(rule.rules);
    }
  }
};

extractIdentifiers();

export default ExportedStyleSheet;
