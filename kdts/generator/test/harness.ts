import { TsParser } from "../../parser/tsParser";
import { inferFromExpression } from "../inference";
import { generate } from "../kdjsFromAst";

type JsDocParam = {
  name: string;
  type: string;
};

type JsDocInfo = {
  params: JsDocParam[];
  returnType: string | null;
  tags: string[];
  templates: string[];
  signature: string | null;
  out: string;
};

type TaggedTarget = {
  tag: string;
  target: string;
  type: string;
};

const parse = (source: string) => TsParser.parse(source);

const emit = (source: string): string => generate(parse(source));

const emitFirst = (source: string): string => {
  const body = parse(source).body as any[];
  return generate(body[0]);
};

const expressionOf = (source: string): any => {
  const body = parse(`const _ = ${source};`).body as any[];
  return body[0].declarations[0].init;
};

const inferredTypeOf = (source: string): string | undefined => {
  const inferred = inferFromExpression(expressionOf(source));
  return inferred && generate(inferred);
};

const renderedTypeOf = (source: string): string => {
  const body = parse(source).body as any[];
  return generate(body[0].declarations[0].id.typeAnnotation.typeAnnotation);
};

const stripIndent = (text: string): string => {
  const lines = text.replace(/^\n/, "").split("\n");
  const nonEmpty = lines.filter((line) => line.trim());
  const indent = nonEmpty.length
    ? Math.min(...nonEmpty.map((line) => line.match(/^ */)![0].length))
    : 0;
  return lines.map((line) => line.slice(indent)).join("\n");
};

const readJsDoc = (output: string): JsDocInfo => {
  const lines = output.split("\n").map((line) => line.trim());
  const params: JsDocParam[] = [];
  const tags: string[] = [];
  const templates: string[] = [];
  let returnType: string | null = null;

  for (const line of lines) {
    const param = line.match(/^\* @param \{(.+)\} (.+)$/);
    if (param) {
      params.push({ type: param[1], name: param[2] });
      continue;
    }

    const ret = line.match(/^\* @return \{(.+)\}$/);
    if (ret) {
      returnType = ret[1];
      continue;
    }

    const template = line.match(/^\* @template (.+)$/);
    if (template) {
      templates.push(...template[1].split(", ").filter(Boolean));
      continue;
    }

    const tag = line.match(/^\* @([a-z]+)(?:\b.*)?$/);
    if (tag) {
      tags.push(tag[1]);
    }
  }

  const signature = lines.find((line) =>
    !!line && line !== "/**" && line !== "*/" && !line.startsWith("* ")
  ) ?? null;

  return { params, returnType, tags, templates, signature, out: output };
};

const readTaggedTargets = (output: string): TaggedTarget[] => {
  const targets: TaggedTarget[] = [];
  let pending: Omit<TaggedTarget, "target"> | null = null;

  for (const raw of output.split("\n")) {
    const line = raw.trim();
    if (!line) continue;

    const inline = line.match(/^\/\*\* @([a-z]+) \{(.+)\} \*\/$/);
    if (inline) {
      pending = { tag: inline[1], type: inline[2] };
      continue;
    }

    const block = line.match(/^\* @([a-z]+) \{(.+)\}$/);
    if (block) {
      pending = { tag: block[1], type: block[2] };
      continue;
    }

    if (line === "/**" || line === "*/" || line.startsWith("* @") || line.startsWith("*"))
      continue;

    if (pending) {
      targets.push({
        ...pending,
        target: line.endsWith(";") ? line.slice(0, -1) : line
      });
      pending = null;
    }
  }

  return targets;
};

export {
  emit,
  emitFirst,
  expressionOf,
  inferredTypeOf,
  readJsDoc,
  readTaggedTargets,
  renderedTypeOf,
  stripIndent
};
export type { JsDocInfo, JsDocParam, TaggedTarget };
