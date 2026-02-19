import { Parser } from "acorn";
import acornJsx from "acorn-jsx";
import {
  ImportStatement, writeImportStatement
} from "../../kdjs/util/modules";
import { Update, update } from "../../kdjs/util/textual";
import { getExt, getDir, combine } from "../../util/paths";
import css from "./css";
import { DomIdMapper } from "./domIdMapper";

/** @const {Parser} */
const JsxParser = Parser.extend(acornJsx());

/**
 * @enum {number}
 */
const SpecifierState = {
  Remove: 0,
  PinRemove: 1, // Pin the import but remove the specifier.
  Keep: 2,
};

const resolveModulePath = (importer, source) => source.startsWith('.')
  ? combine(getDir(importer), source)
  : source.slice(1);

/**
 * Applies the kastro/kdjs transpilation rules to a jsx file obtaining a pure
 * js file. The rules are as follows:
 *
 *  - Replace every jsx expression with a Promise.reject(), but emit a list of
 *    initialization statements obtained from the jsx expression.
 *
 *  - If the file is the entry, strip the default export. (note this is done
 *    only in jsx files, which are interpreted as kastro components)
 *
 *  - Remove imports which were needed only for the jsx expressions.
 *
 * @param {boolean} isEntry Is the current file the entry file provided to kdjs.
 * @param {string} file Name of the file
 * @param {string} content The contents as a string
 * @param {DomIdMapper} domIdMapper
 * @return {string} The transpiled js file
 */
const transpile = (isEntry, file, content, domIdMapper, globals) => {
  /** @const {Array<!acorn.Comment>} */
  const comments = [];
  /** @const {Array<Update>} */
  const updates = [];
  /** @const {Array<!acorn.ImportDeclaration>} */
  const importStatements = [];
  /** @typedef {{ node: !acorn.ImportDeclaration, state: SpecifierState }} */
  const SpecifierInfo = {};
  /** @const {Object<string, SpecifierInfo>} */
  const specifierInfo = {};
  /** @const {Set} */
  const assetComponents = new Set();
  /** @const {Set} */
  const localComponents = new Set();
  /** @const {Set} */
  const styleSheetComponents = new Set();
  /** @const {Map<string, string>} */
  const workerComponents = new Map();

  /**
   * @param {!acorn.ImportDeclaration} node
   */
  const addImport = (node) => {
    importStatements.push(node);
    for (const specifier of node.specifiers)
      specifierInfo[specifier.local.name] = { node, state: SpecifierState.Remove };
  }

  const specialComponents = {
    Switch: (node, props) => {
      node.children = node.children.filter((c) => c.type == "JSXElement");
      const length = node.children.length;
      if (!length) return;
      /** @const {number} */
      const selectedPane = props.initialPane ? props.initialPane.expression.value : 0;
      const fnExprs = Array(length);
      for (let i = 0; i < length; ++i) {
        const statements = [];
        if (i != selectedPane)
          processJsxElement(node.children[i], node, i, statements);
        const fnExpr = statements.length
          ? statements.length == 1
            ? `() => ${statements[0]}`
            : `() => {\n  ${statements.join(";\n  ")}\n}`
          : "null";
        fnExprs[i] = fnExpr;
      }
      props.children = `[${fnExprs.join(", ")}]`;
      node.children[0] = node.children[selectedPane];
      node.children.length = 1;
    },

    KeyedSwitch: (node, props) => {
      node.children = node.children.filter((c) => c.type == "JSXElement");
      const length = node.children.length;
      if (!length) return;
      // Build keyToIndex map and collect keys
      const keyToIndex = {};
      node.children.forEach((child, i) => {
        const keyProp = child.openingElement.attributes
          .find(attr => attr.name.name === "key");
        if (!keyProp)
          throw new Error("KeyedSwitch children must have key prop");
        const key = keyProp.value.value;
        keyToIndex[key] = i;
      });

      /** @const {string} */
      const initialPane = props.initialPane ? props.initialPane.expression.value : "";
      /** @const {number} */
      const selectedPane = initialPane ? keyToIndex[initialPane] : 0;

      const fnExprs = Array(length);
      for (let i = 0; i < length; ++i) {
        const statements = [];
        if (i != selectedPane)
          processJsxElement(node.children[i], node, i, statements);
        const fnExpr = statements.length
          ? statements.length == 1
            ? `() => ${statements[0]}`
            : `() => {\n  ${statements.join(";\n  ")}\n}`
          : "null";
        fnExprs[i] = fnExpr;
      }
      props.keyToIndex = `${JSON.stringify(keyToIndex)}`;
      props.children = `[${fnExprs.join(", ")}]`;
      node.children[0] = node.children[selectedPane];
      node.children.length = 1;
    }
  }

  /**
   * @param {!acorn.Node} node
   * @return {string}
   */
  const getJsxTagName = (node) => {
    /** @type {string[]} */
    const parts = [];
    /** @type {acorn.Node} */
    let current = node.openingElement.name;

    while (current.type === "JSXMemberExpression") {
      parts.push(current.property.name);
      current = current.object;
    }
    parts.push(current.name);
    return parts.reverse().join(".");
  }

  /**
   * @param {!acorn.JSXElement|!acorn.JSXFragment} node The jsx expression root to process
   * @param {acorn.JSXElement} parent The parent element
   * @param {number} childIndex The index of the child element
   * @param {string[]} statements The array to emit the statements into
   * @return {number} The number of immediate child elements (1 for JSXElement, n for JSXFragment)
   */
  const processJsxElement = (node, parent, childIndex, statements) => {
    if (node.type == "JSXElement") {
      const elem = /** @type {acorn.JSXElement} */(node);
      if (elem.openingElement) {
        /** @const {string} */
        const tagName = getJsxTagName(elem);
        if (assetComponents.has(tagName) && !workerComponents.has(tagName)) return 0;
        if (tagName.charCodeAt(0) < 91) {
          const info = specifierInfo[tagName];
          if (info && info.state == SpecifierState.Remove)
            info.state = SpecifierState.PinRemove;
          if (styleSheetComponents.has(tagName)) return 0;

          const props = {};
          let keepImport = false;
          let instance = null;
          let hasOptionalProps = false;
          for (const attr of elem.openingElement.attributes) {
            if (attr.type !== 'JSXAttribute') continue;
            const name = attr.name.name;
            if (name.startsWith("on") && name.charCodeAt(2) < 91) {
              keepImport = true;
              traverse(attr.value.expression, attr.value);
              statements.push(`${tagName}.${name.toLowerCase()} = ${content.slice(attr.value.start + 1, attr.value.end - 1)}`);
            } else if (name.startsWith("controls") && name.charCodeAt(8) < 91) {
              keepImport = true;
              traverse(attr.value.expression, attr.value);
              statements.push(`dom.bind${name.slice(8)}(${tagName}, ${content.slice(attr.value.start + 1, attr.value.end - 1)})`);
            } else if (name == "instance") {
              keepImport = true;
              instance = content.slice(attr.value.start + 1, attr.value.end - 1);
            } else if (parent.type == "JSXElement" && parent.openingElement.name.name == "KeyedSwitch" && name == "key") {
              // Ignore key prop for KeyedSwitch
            } else if (!name.endsWith("$"))
              props[name] = attr.value;
            else
              hasOptionalProps = true;
          }
          const maybeWorkerBundleName = workerComponents.get(tagName);
          if (maybeWorkerBundleName) {
            statements.push(`/** @const {Worker} */\n  ${instance} = new Worker("${maybeWorkerBundleName}", { type: "module" });`);
          } else if ((tagName in specifierInfo || localComponents.has(tagName)) && !styleSheetComponents.has(tagName)) {
            keepImport = true;

            const specialComponentHandler = specialComponents[tagName];
            if (specialComponentHandler)
              specialComponentHandler(node, props);

            const serialize = (v) => {
              if (typeof v === "string") return v;
              if (!v) return "true";
              if (v.type == "Literal") return JSON.stringify(v.value);
              traverse(v.expression, null);
              return content.slice(v.start + 1, v.end - 1);
            }
            const callParams = (Object.keys(props).length || hasOptionalProps)
              ? `{\n    ${Object.entries(props).map(([k, v]) => `${k}: ${serialize(v)}`).join(",\n    ")}\n  }`
              : "";
            const call = `${tagName}(${callParams})`;
            statements.push(instance ? `/** @const {${tagName}} */\n  ${instance} = new ${call}` : call);
          }
          if (keepImport && info)
            info.state = SpecifierState.Keep;
        } else if (tagName.charCodeAt(0) > 90) {
          // Handle immediate children of pseudo components.
          for (const attr of elem.openingElement.attributes) {
            const name = attr.name.name;
            if (name.startsWith("on") && name.charCodeAt(2) < 91) {
              traverse(attr.value.expression, attr.value);
              const value = content.slice(attr.value.start + 1, attr.value.end - 1);
              const element = `${getJsxTagName(parent)}.children[${childIndex}]`;
              statements.push(`${element}.${name.toLowerCase()} = ${value}`);
            }
          }
        }
      }
    }
    let childElementCount = 0;
    for (const child of node.children) {
      if (child.type === 'JSXElement' || child.type === 'JSXFragment')
        childElementCount += processJsxElement(child, node, childElementCount, statements);
    }
    return 1;
  }

  const processInlineCss = (node, parent) => {
    /** @const {string} */
    const strippedCss = content.slice(node.start + 4, node.end - 1)
      .replace(/\$\{[^}]*\}/g, "a"); // Template literals cannot be exported identifiers, simply replace them with a placeholder

    if (parent.type == "VariableDeclarator" && parent.id.type == "Identifier")
      styleSheetComponents.add(parent.id.name);

    updates.push({
      beg: node.start,
      end: node.end,
      put: css.getEnum(file, strippedCss, domIdMapper)
    });
  }

  /**
   * @param {!acorn.Node} node
   * @param {!acorn.Node} parent
   */
  const traverse = (node, parent) => {
    if (!node || typeof node !== 'object') return;

    if (node.type === 'Identifier' && specifierInfo[node.name]) {
      const isPropertyName = parent?.type === 'MemberExpression' && parent.property === node;
      const isDestructured = parent?.type === 'Property' && parent.key === node && parent.parent?.type === 'ObjectPattern';
      if (!isPropertyName && !isDestructured)
        specifierInfo[node.name].state = SpecifierState.Keep;
    } else if (node.type === "TaggedTemplateExpression") {
      if (node.tag.type == "Identifier" && node.tag.name == "css") {
        processInlineCss(node, parent);
        return;
      }
    } else if (node.type == "ObjectExpression") {
      // Remove name$ properties from all object expressions.
      for (let i = 0; i < node.properties.length; ++i) {
        const prop = node.properties[i];
        if (prop.key.type === "Identifier" && prop.key.name.endsWith("$")) {
          const end = i < node.properties.length - 1
            ? node.properties[i + 1].start  // Remove up to next property
            : prop.end + 1;                     // Last property
          updates.push({
            beg: prop.start,
            end: end,
            put: ""
          });
        }
      }
    } else if (node.type === "JSXElement" || node.type === "JSXFragment") {
      const statements = [];
      processJsxElement(node, parent, 0, statements);
      const statementStr = statements.length ? statements.join(";\n  ") + ";" : "";
      if (parent.type === "ArrowFunctionExpression") {
        const params = parent.params.map(param => content.slice(param.start, param.end)).join(", ");
        updates.push({
          beg: parent.start,
          end: parent.end,
          put: `(${params}) => {\n  ${statementStr}\n}`
        });
      } else {
        updates.push({
          beg: parent.start,
          end: parent.end,
          put: statementStr
        });
      }
      return;
    }
    for (const key in node) {
      if (Array.isArray(node[key]))
        node[key].forEach(child => traverse(child, node));
      else
        traverse(node[key], node);
    }
  }

  const processComponents = (ast) => {
    for (const node of ast.body) {
      if (node.type != "ImportDeclaration")
        traverse(node, null);
    }
  }

  /**
   * @param {!acorn.Program} ast
   */
  const collectComponents = (ast) => {
    for (const node of ast.body) {
      if (node.type == "ImportDeclaration") {
        /** @const {string} */
        const source = node.source.value;
        /** @const {string} */
        const ext = getExt(source, "js");
        /** @const {boolean} */
        const isWorkerComponent = source.startsWith("kastro:") && ext == "js";
        /** @const {boolean} */
        const isAsset = ext == "svg" || ext == "png" || ext == "webp"
          || ext == "ttf" || ext == "woff2"
          || source.startsWith("kastro:")
          || source.includes("kastro/image")
          || source.includes("kastro/stylesheet");
        if (isAsset) {
          for (const specifier of node.specifiers)
            assetComponents.add(specifier.local.name);
          updates.push({ beg: node.start, end: node.end, put: "; // Asset component" });
        } else
          addImport(node);
        if (ext == "css") {
          for (const specifier of node.specifiers)
            styleSheetComponents.add(specifier.local.name);
        } else if (isWorkerComponent) {
          let defaultImport = null;
          for (const specifier of node.specifiers) {
            if (specifier.type === "ImportDefaultSpecifier")
              defaultImport = specifier.local.name;
            else if (specifier.type === "ImportSpecifier")
              throw new Error("Named imports are not allowed for worker components.");
          }
          if (!defaultImport)
            throw new Error("At least one default import is required for worker components.");
          const workerImportSource = resolveModulePath(file, source.slice("kastro:".length));
          workerComponents.set(defaultImport, globals.Workers[workerImportSource]);
        }
      } else if (node.type == "VariableDeclaration") {
        for (const decl of node.declarations) {
          const name = decl.id.name;
          if (decl.id.type === "Identifier" && name.charCodeAt(0) < 91 &&
            decl.init &&
            (decl.init.type === "ArrowFunctionExpression" ||
              decl.init.type === "FunctionExpression"))
            localComponents.add(name);
        }
      }
    }
  }

  const processComments = (comments) => {
    /** @const {RegExp} */
    const TypePattern = /{[^}]+}/g;
    /** @const {RegExp} */
    const IdentPattern = /[^!?,|<>{}\s:()*=\[\]]+/g;
    for (const comment of comments) {
      /** @const {string} */
      const text = comment.value;
      /** @const {string[]} */
      const typeBlocks = text.match(TypePattern) || [];
      for (const block of typeBlocks) {
        /** @const {string[]} */
        const identifiers = block.match(IdentPattern) || [];
        for (const ident of identifiers) {
          const rootIdent = ident.split('.')[0];
          const info = specifierInfo[rootIdent];
          if (info) info.state = SpecifierState.Keep;
        }
      }
    }
  }

  const pruneImports = () => {
    for (const importStatement of importStatements) {
      /** @const {ImportStatement} */
      const newImportStmt = { source: importStatement.source.value, named: {}, unnamed: "" };
      /** @type {boolean} */
      let keepBare = !importStatement.specifiers.length;
      for (const specifier of importStatement.specifiers) {
        const state = specifierInfo[specifier.local.name].state;
        if (state == SpecifierState.Keep)
          if (specifier.type == "ImportDefaultSpecifier")
            newImportStmt.unnamed = specifier.local.name;
          else
            newImportStmt.named[specifier.local.name] = specifier.imported.name;
        keepBare ||= !!state;
      }
      updates.push({
        beg: importStatement.start,
        end: importStatement.end,
        put: keepBare
          ? writeImportStatement(newImportStmt, importStatement.source.value)
          : `; // No pins for "${newImportStmt.source}"`
      });
    }
  }

  const initializeEntry = () => {
    let rootComponentName = file.slice(file.lastIndexOf("/") + 1).replace(".jsx", "");
    /** @type {acorn.Node} */
    let defaultExport = null;
    let exportNode = null;

    for (const node of ast.body) {
      if (node.type === "ExportDefaultDeclaration") {
        exportNode = node;
        defaultExport = node.declaration;  // Either Identifier or Function
        break;
      }
    }

    if (!defaultExport) throw new Error("Root component must be exported as default");

    if (defaultExport.type === "Identifier") {
      rootComponentName = defaultExport.name;
      updates.push({
        beg: exportNode.start,
        end: exportNode.end,
        put: ""
      });
    } else {
      updates.push({
        beg: exportNode.start,
        end: exportNode.declaration.start,
        put: `const ${rootComponentName} = `
      });
    }

    if (defaultExport.type === "Identifier") {
      const name = defaultExport.name;
      for (const node of ast.body) {
        if (node.type === "VariableDeclaration") {
          for (const decl of node.declarations) {
            if (decl.id.name === name) {
              defaultExport = decl.init;
              break;
            }
          }
        }
      }
    }
    const nameToType = {
      "Lang": "LangCode",
    };
    const serializeValueOf = (key) => {
      const serialized = JSON.stringify(globals[key]);
      const type = nameToType[key];
      return type ? `/** @type {${type}} */(${serialized})` : serialized;
    }

    const propStrings = [];
    if (defaultExport.params.length) {
      if (defaultExport.params.length > 1)
        throw new Error("Root component cannot have more than one parameter");

      const params = defaultExport.params[0];
      if (params.type !== "ObjectPattern")
        throw new Error("Root component must have an object parameter");

      for (const prop of params.properties) {
        const propName = prop.key.name;
        if (propName in globals)
          propStrings.push(
            `${propName}: ${serializeValueOf(propName)}`
          );
      }
    }
    updates.push({
      beg: ast.end,
      end: ast.end,
      put: `${rootComponentName}(${propStrings.length ? `{\n  ${propStrings.join(",\n  ")}\n}` : ""});`
    });
  };

  /** @const {acorn.Program} */
  const ast = JsxParser.parse(content, {
    sourceType: "module",
    ecmaVersion: "latest",
    onComment: comments
  });

  collectComponents(ast);
  processComponents(ast);
  processComments(comments)
  pruneImports();
  if (isEntry)
    initializeEntry();

  return update(content, updates);
};

export default { transpile };
