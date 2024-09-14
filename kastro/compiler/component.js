import { Parser } from "htmlparser2";
import { readdir, readFile } from "node:fs/promises";
import { KapalıTag, tagYaz } from "../../util/html";
import { CompilerError } from "./compiler";
import { renderParagraph } from "./latex";

const Fixes = {
  "Ã¼": "ü",
  [new TextDecoder().decode(Uint8Array.from([195, 132, 194, 159]))]: 'ğ',
  [new TextDecoder().decode(Uint8Array.from([195, 133, 194, 159]))]: 'ş',
  [new TextDecoder().decode(Uint8Array.from([195, 132, 194, 177]))]: 'ı',
  [new TextDecoder().decode(Uint8Array.from([195, 132, 194, 176]))]: 'İ',
  [new TextDecoder().decode(Uint8Array.from([195, 131, 194, 182]))]: 'ö',
  [new TextDecoder().decode(Uint8Array.from([195, 132, 194, 159]))]: 'ğ',
};

const FixesRegex = new RegExp(Object.keys(Fixes).join("|"), "g");

const normalizePath = (path) => path.replace(/^(\/|\.\/)/, '')
  .replace(FixesRegex, (match) => Fixes[match]);

const getComponentFiles = (name) => readdir(name).then((files) => {
  const css = files.find((file) => file.endsWith('.css'));
  let markup = files.find((file) => file.endsWith('.html'));
  if (!markup) {
    const jsxFiles = files.filter((file) => file.endsWith(".jsx"));
    if (jsxFiles.length == 0)
      throw new Error(`Component ${name} does not have a markup file (.html or .jsx)`);
    const preferredJsxFiles = new Set(["index.jsx", "birim.jsx", "comp.jsx"]);
    markup = jsxFiles.find((file) => preferredJsxFiles.has(file)) || jsxFiles[0];
  }
  return {
    markup: `${name}/${markup}`,
    css: css ? `${name}/${css}` : null
  };
}, () => console.log(name, new TextEncoder().encode(name)));

/**
 * @param {string} name
 * @param {!Object<string, *>} props
 * @param {!Object<string, *>} globals
 * @return {!Promise<string>} resolves to the compiled html content
 */
const compileComponent = (name, props, globals) => {
  // TODO(KimlikDAO-bot): fix
  name = normalizePath(name);

  /** @const {boolean} */
  const EN = globals.Lang == "en";
  /** @const {!Array<boolean>} */
  const phantom = [];
  /** @type {number} */
  let depth = 0;
  /** @type {number} */
  let değiştirDerinliği = 0;
  /** @type {string} */
  let sırada;
  /** @type {boolean} */
  let latexVar = false;
  /** @type {number} */
  let latexDerinliği = 0;
  /** @const {!Array<string|!Promise<string>>} */
  let htmlParts = [];

  /**
   * In htmlx modules, the local variables are set by `data-key = value`
   * properties at the call site, which adds the key = value pair to the
   * local variables.
   *
   * In jsx modules, the same is done with adding the `key = value` property at
   * the call site.
   *
   * @const {!Object<string, string>}
   */
  const contextVars = Object.assign({}, globals);
  for (const prop in props)
    if (prop.startsWith("data-")) {
      contextVars[prop.slice(5)] = props[prop];
      delete props[prop];
    }
  contextVars.piggyback ||= "";

  const resolveVars = (template) => template.replace(/{\s*([^}]+)\s*}/g, (_, expression) => {
    const [key, defaultValue] = expression.split(/\s*\|\|\s*/).map(s => s.trim());
    /** @const {string} */
    const lookupKey = key.startsWith("i18n:")
      ? (globals.Lang + key.slice(4)) in contextVars
        ? globals.Lang + key.slice(4)
        : key.slice(5)
      : key;

    if (lookupKey in contextVars) {
      return contextVars[lookupKey];
    } else if (defaultValue) {
      return defaultValue.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
    } else {
      return '';
    }
  });

  /** @const {!Parser} */
  const parser = new Parser({
    onopentag(tagName, tagProps, selfClosing) {
      selfClosing ||= KapalıTag[tagName];
      depth += 1;

      if (tagName.toLowerCase() == "html")
        tagProps.lang = globals.Lang;

      if (globals.BuildMode > 0 && tagName.toLowerCase() == "script")
        return htmlParts.push(generateScript(tagProps, globals));

      if ("data-dev-remove" in tagProps) {
        delete tagProps["data-dev-remove"];
        if (globals.BuildMode == 0) return;
      }
      if ("data-release-remove" in tagProps) {
        delete tagProps["data-release-remove"];
        if (global.BuildMode != 0) return;
      }
      if ("data-remove-if" in tagProps) {
        const remove = contextVars[tagProps["data-remove-if"]]
        delete tagProps["data-remove-if"];
        if (remove) return;
      }

      if (değiştirDerinliği > 0) return;

      /** @type {!Promise<string>|string} */
      let değiştirMetni = "";

      for (const /** string */ prop in tagProps) {
        if (prop[2] == ":") {
          if (prop.slice(0, 2) == globals.Lang)
            tagProps[prop.slice(3)] = tagProps[prop];
          delete tagProps[prop];
        } else if (prop.startsWith("data-remove-")) {
          if (globals.BuildMode != 0)
            delete tagProps[prop.slice("data-remove-".length)];
          delete tagProps[prop];
        } else if (prop.startsWith("data-en-")) {
          if (EN) tagProps[prop.slice("data-en-".length)] = tagProps[prop];
          delete tagProps[prop];
        }
      }

      for (const prop in tagProps) {
        const val = tagProps[prop];
        if (val.includes("{"))
          tagProps[prop] = resolveVars(val);
      }

      if ("data-inherit" in tagProps) {
        for (const değişken of tagProps["data-inherit"].split(/[ ,]+/))
          if (contextVars[değişken])
            tagProps["data-" + değişken] = contextVars[değişken];
        delete tagProps["data-inherit"];
      }

      if (tagName.startsWith("altbirim:") || tagName.startsWith("subcomponent:")) {
        /** @const {string} */
        const subComponentName = name + tagName.slice(tagName.indexOf(":")).replaceAll(":", "/");
        return htmlParts.push(compileComponent(subComponentName, tagProps, globals));
      }

      // altbirim haricinde ":" içeren taglar dizin olarak parse ediliyor.
      // TODO(KimlikDAO-bot): Birimin içini parse edip birime yolla.
      if (tagName.includes(":"))
        return htmlParts.push(compileComponent(tagName.replaceAll(":", "/"), tagProps, globals));

      if (`data-${globals.Lang}` in tagProps) {
        if (değiştirDerinliği) {
          console.error("Nested string substitution");
          process.exit(CompilerError.NESTED_REPLACE);
        }
        değiştirDerinliği = depth;
        değiştirMetni = tagProps["data-en"];
      }
      for (const prop in tagProps)
        if (prop.startsWith("data-") && prop.length == 7)
          delete tagProps[prop];

      if ("data-latex" in tagProps) {
        latexVar = true;
        latexDerinliği = depth;
        delete tagProps["data-latex"];
      }

      if ("data-phantom" in tagProps || tagName.toLowerCase() == "i18n") {
        if (tagName != "span" && tagName != "g" && tagName != "div" && tagName != "i18n") {
          console.error("Span div, veya g olmayan phantom!");
          process.exit(HataKodu.INCORRECT_PHANTOM);
        }
        phantom[depth] = true;
      } else {
        if (depth == 1)
          Object.assign(tagProps, props);
        htmlParts.push(tagYaz(tagName, tagProps, selfClosing));
      }

      htmlParts.push(değiştirMetni);
    },

    ontext(text) {
      if (değiştirDerinliği > 0) return;
      if (sırada) {
        text = sırada;
        sırada = null;
      }
      text = resolveVars(text);
      if (latexDerinliği) text = renderParagraph(text);
      htmlParts.push(text);
    },

    oncomment(comment) {
      comment = comment.trim();
      if (comment.startsWith(globals.Lang + ":"))
        sırada = comment.slice(3);
    },

    onclosetag(tagName, hayali) {
      hayali ||= KapalıTag[tagName] || tagName.includes(":");
      sırada = null;
      if (depth == değiştirDerinliği)
        değiştirDerinliği = 0;
      if (depth == latexDerinliği)
        latexDerinliği = 0;
      if (değiştirDerinliği == 0 && !phantom[depth] && !hayali)
        htmlParts.push(`</${tagName}>`);

      phantom[depth] = false;
      depth -= 1;
    },

    onprocessinginstruction(name, data) {
      if (name.toLowerCase() == "!doctype")
        htmlParts.push(`<${data}>`);
    }
  }, {
    recongnizeSelfClosing: true,
    lowerCaseTags: false,
    lowerCaseAttributeNames: false,
  });

  return getComponentFiles(name).then(({ markup, css }) => (
    markup.endsWith(".html")
      ? readFile(markup, "utf8")
      : import(process.cwd() + "/" + markup).then((mod) => mod.default(contextVars)))
    .then((markupContent) => {
      parser.end(markupContent);
      if (css && !css.startsWith("/")) css = "/" + css;
      if (css && !globals.SharedCss.has(css)
        && !globals.PageCss.has(css))
        globals.PageCss.add(css);
      if (latexVar)
        globals.PageCss.add("/lib/kastro/sayfa/latex.css");

      return Promise.all(htmlParts).then((parts) => parts.join(""));
    })
  );
}

export {
  compileComponent
};
