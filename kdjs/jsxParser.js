import { Parser } from "acorn";
import acornJsx from "acorn-jsx";
import { getExt } from "../util/paths";
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
 * @return {string} The transpiled js file
 */
const transpileJsx = (isEntry, file, content) => {
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

          /** @const {acorn.JSXAttribute|undefined} */
          const idProp = elem.openingElement.attributes.find(
            (attr) => attr.type === 'JSXAttribute' && attr.name.name === 'id'
          );
          if (idProp) {
            if (info) info.state = SpecifierState.Keep;
            traverse(idProp.value.expression, idProp.value);
            statements.push(`${tagName}({ id: ${content.slice(idProp.value.start + 1, idProp.value.end - 1)} });`);
          }
          /** @const {!Array<!acorn.JSXAttribute>} */
          const onEventProps = elem.openingElement.attributes.filter(
            (attr) => attr.type === 'JSXAttribute' &&
              attr.name.name.startsWith('on') &&
              attr.name.name[2] === attr.name.name[2].toUpperCase()
          );
          for (const prop of onEventProps) {
            if (info) info.state = SpecifierState.Keep;
            traverse(prop.value.expression, prop.value);
            statements.push(`${tagName}.${prop.name.name.toLowerCase()} = ${content.slice(
              prop.value.start + 1,
              prop.value.end - 1)};`
            );
          }
        }
      }
    }
    node.children?.forEach((child) => {
      if (child.type === 'JSXElement' || child.type === 'JSXFragment')
        processJsxElement(child, statements);
    });
  }

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
    }
    // Handle JSX Elements separately
    else if (node.type === "JSXElement" || node.type === "JSXFragment") {
      const statements = [];
      processJsxElement(node, statements);
      if (statements.length) {
        if (parent.type === "ReturnStatement") {
          updates.push({
            beg: parent.start,
            end: parent.end,
            put: "\n  " + statements.join("\n") + "\n  return null;"
          });
        } else if (parent.type === "ArrowFunctionExpression") {
          updates.push({
            beg: parent.start,
            end: parent.end,
            put: `() => {\n  ${statements.join("\n")}\n  return null;\n}`
          });
        }
      } else updates.push({ beg: node.start, end: node.end, put: "null" });
      return;
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

  /** @type {?acorn.ExportDefaultDeclaration} */
  let defaultExport = null;
  for (const node of ast.body) {
    if (node.type == "ImportDeclaration") {
      /** @const {string} */
      const source = node.source.value;
      /** @const {string} */
      const ext = getExt(source, "js");
      /** @const {boolean} */
      const isAsset = ext == "svg" || ext == "png" || ext == "webp" || ext == "ttf" || ext == "woff2";
      if (source.includes(":") || isAsset || source.includes("kastro/image")) {
        for (const specifier of node.specifiers)
          assetComponents.add(specifier.local.name);
        updates.push({ beg: node.start, end: node.end, put: ";" });
      } else
        addImport(node);
    } else if (node.type == "ExportDefaultDeclaration") {
      if (node.declaration.type !== "Identifier") {
        throw new Error(`${file}: Export default must be an identifier`);
      }
      if (isEntry)
        updates.push({ beg: node.start, end: node.end, put: "; // Entry component, remove the default export\n" });
      defaultExport = node;
    } else
      traverse(node, ast);
  }

  if (defaultExport) {
    /** @const {string} */
    const name = defaultExport.declaration.name;
    /** @const {?acorn.Node} */
    const componentNode = ast.body.find(node =>
      (node.type === "FunctionDeclaration" && node.id?.name === name) ||
      (node.type === "VariableDeclaration" &&
        node.declarations.some(d => d.id.name === name))
    );

    if (!componentNode) {
      throw new Error(`${file}: Could not find component definition for ${name}`);
    }
    let params;
    if (componentNode.type === "FunctionDeclaration") {
      params = componentNode.params;
    } else if (componentNode.type === "VariableDeclaration") {
      const init = componentNode.declarations[0].init;
      if (init.type === "ArrowFunctionExpression") {
        params = init.params;
      }
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
    if (!hasIdParam(params)) {
      updates.push({
        beg: defaultExport.start - 1,
        end: defaultExport.start - 1,
        put: `\n${name}(); // Auto-initialize singleton\n`
      })
    }
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

export { transpileJsx };
