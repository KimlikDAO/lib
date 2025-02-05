import { Parser } from "acorn";
import acornJsx from "acorn-jsx";
import { getExt } from "../util/paths";
import { getEnum } from "./cssParser";
import { DomIdMapper } from "./domIdMapper";
import { ImportStatement, writeImportStatement } from "./modules";
import { Update, update } from "./textual";

/** @const {!Parser} */
const JsxParser = Parser.extend(acornJsx());

/**
 * @enum {number}
 */
const SpecifierState = {
  Remove: 0,
  PinRemove: 1, // Pin the import but remove the specifier.
  Keep: 2,
};

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
const transpileJsx = (isEntry, file, content, domIdMapper) => {
  /** @const {!Array<!acorn.Comment>} */
  const comments = [];
  /** @const {!Array<Update>} */
  const updates = [];
  /** @const {!Array<!acorn.ImportDeclaration>} */
  const importStatements = [];
  /** @typedef {{ node: !acorn.ImportDeclaration, state: SpecifierState }} */
  const SpecifierInfo = {};
  /** @const {!Object<string, SpecifierInfo>} */
  const specifierInfo = {};
  /** @const {!Set} */
  const assetComponents = new Set();

  /**
   * @param {!acorn.ImportDeclaration} node
   */
  const addImport = (node) => {
    importStatements.push(node);
    for (const specifier of node.specifiers)
      specifierInfo[specifier.local.name] = { node, state: SpecifierState.Remove };
  }

  /**
   * @param {!acorn.JSXElement|!acorn.JSXFragment} node The jsx expression root to process
   * @param {!Array<string>} statements The array to emit the statements into
   */
  const processJsxElement = (node, statements) => {
    if (node.type == "JSXElement") {
      const elem = /** @type {!acorn.JSXElement} */(node);
      if (elem.openingElement && elem.openingElement.name.type === "JSXIdentifier") {
        /** @const {string} */
        const tagName = elem.openingElement.name.name;
        if (tagName[0] === tagName[0].toUpperCase() && !assetComponents.has(tagName)) {
          const info = specifierInfo[tagName];
          if (info && info.state == SpecifierState.Remove)
            info.state = SpecifierState.PinRemove;

          for (const attr of elem.openingElement.attributes) {
            if (attr.type !== 'JSXAttribute') continue;
            const name = attr.name.name;
            if (name === "id") {
              if (info) info.state = SpecifierState.Keep;
              traverse(attr.value.expression, attr.value);
              statements.push(`${tagName}({ id: ${content.slice(attr.value.start + 1, attr.value.end - 1)} });`);
            } else if (name.startsWith("on") && name.charCodeAt(2) < 91) {
              if (info) info.state = SpecifierState.Keep;
              traverse(attr.value.expression, attr.value);
              statements.push(`${tagName}.${name.toLowerCase()} = ${content.slice(attr.value.start + 1, attr.value.end - 1)};`);
            } else if (name == "controlsDropdown") {
              const controlled = attr.value.expression.name;
              const controlledInfo = specifierInfo[controlled];
              if (controlledInfo) controlledInfo.state = SpecifierState.Keep;
              if (info) info.state = SpecifierState.Keep;
              statements.push(`dom.bindDropdown(${tagName}, ${controlled});`);
            }
          }
        }
      }
    }
    node.children?.forEach((child) => {
      if (child.type === 'JSXElement' || child.type === 'JSXFragment')
        processJsxElement(child, statements);
    });
  }

  const hasIdParam = (params) => {
    if (!params || params.length === 0) return false;
    return params.some(param =>
      param.type === "ObjectPattern" &&  // Must be destructured
      param.properties.some(prop =>
        prop.type === "Property" &&
        prop.key.name === "id"
      )
    );
  };

  /**
   * @param {!acorn.Node} node
   * @param {!acorn.Node} parent
   */
  const traverse = (node, parent) => {
    if (!node || typeof node !== 'object') return;

    // Handle identifiers in JS context
    if (node.type === 'Identifier' && specifierInfo[node.name]) {
      const isPropertyName = parent?.type === 'MemberExpression' && parent.property === node;
      const isDestructured = parent?.type === 'Property' && parent.key === node && parent.parent?.type === 'ObjectPattern';

      if (!isPropertyName && !isDestructured)
        specifierInfo[node.name].state = SpecifierState.Keep;
    } else if (node.type === "TaggedTemplateExpression") {
      if (node.tag.type == "Identifier" && node.tag.name == "css") {
        /** @const {string} */
        const strippedCss = content.slice(node.start + 4, node.end - 1)
          .replace(/\$\{[^}]*\}/g, "a"); // Template literals cannot be exported, simply replace them with a placeholder
        updates.push({
          beg: node.start,
          end: node.end,
          put: getEnum(file, strippedCss, domIdMapper)
        });
      }
    } else if (node.type === "JSXElement" || node.type === "JSXFragment") {
      const statements = [];
      processJsxElement(node, statements);
      if (statements.length) {
        if (parent.type === "ReturnStatement") {
          updates.push({
            beg: parent.start,
            end: parent.end,
            put: "\n  " + statements.join("\n  ") + "\n  return null;"
          });
        } else if (parent.type === "ArrowFunctionExpression") {
          const params = parent.params.map(param => content.slice(param.start, param.end)).join(", ");
          updates.push({
            beg: parent.start,
            end: parent.end,
            put: `(${params}) => {\n  ${statements.join("\n  ")}\n  return null;\n}`
          });
        }
      } else updates.push({ beg: node.start, end: node.end, put: "null" });
      return;
    } else if (node.type == "VariableDeclaration") {
      for (const decl of node.declarations) {
        const name = decl.id.name;
        if (decl.id.type === "Identifier" && name.charCodeAt(0) < 91 &&
          decl.init &&
          (decl.init.type === "ArrowFunctionExpression" ||
            decl.init.type === "FunctionExpression") &&
          !hasIdParam(decl.init.params)
        ) {
          updates.push({
            beg: node.end,
            end: node.end,
            put: `\n${name}(); // Auto-initialize singleton\n`
          })
        }
      }
    }
    for (const key in node) {
      if (Array.isArray(node[key]))
        node[key].forEach(child => traverse(child, node));
      else
        traverse(node[key], node);
    }
  }

  /** @const {!acorn.Program} */
  const ast = JsxParser.parse(content, {
    sourceType: "module",
    ecmaVersion: "latest",
    onComment: comments
  });

  for (const node of ast.body) {
    if (node.type == "ImportDeclaration") {
      /** @const {string} */
      const source = node.source.value;
      /** @const {string} */
      const ext = getExt(source, "js");
      /** @const {boolean} */
      const isAsset = ext == "svg" || ext == "png" || ext == "webp" || ext == "ttf" || ext == "woff2";
      if (source.includes(":") || isAsset
        || source.includes("kastro/image") || source.includes("kastro/stylesheet")) {
        for (const specifier of node.specifiers)
          assetComponents.add(specifier.local.name);
        updates.push({ beg: node.start, end: node.end, put: "; // Asset component" });
      } else
        addImport(node);
    } else if (node.type == "ExportDefaultDeclaration" && isEntry) {
      updates.push({
        beg: node.start,
        end: node.end,
        put: "; // Entry component, remove the default export\n"
      });
    } else
      traverse(node, ast);
  }

  /** @const {RegExp} */
  const TypePattern = /{[^}]+}/g;
  /** @const {RegExp} */
  const IdentPattern = /[^!?,|<>{}\s:()*=]+/g;

  /**
   * @param {!acorn.Comment} comment
   */
  const processComment = (comment) => {
    /** @const {string} */
    const text = comment.value;
    /** @const {!Array<string>} */
    const typeBlocks = text.match(TypePattern) || [];
    for (const block of typeBlocks) {
      /** @const {!Array<string>} */
      const identifiers = block.match(IdentPattern) || [];
      for (const ident of identifiers) {
        const info = specifierInfo[ident];
        if (info) info.state = SpecifierState.Keep;
      }
    }
  }

  for (const comment of comments)
    processComment(comment);

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
  return update(content, updates);
};

export default { transpileJsx };
