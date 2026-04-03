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

const readJsDoc = (output: string): JsDocInfo => {
  const lines = output.split("\n").map((line) => line.trim());
  const params: JsDocParam[] = [];
  const tags: string[] = [];
  const templates: string[] = [];
  let returnType: string | null = null;

  for (let i = 0; i < lines.length; ++i) {
    const line = lines[i]!;

    if (line.startsWith("* @param ")) {
      let paramText = line.slice("* @param ".length);

      while (!/^\{[\s\S]+\} (.+)$/.test(paramText) && i + 1 < lines.length) {
        const nextLine = lines[++i]!;
        if (!nextLine.startsWith("*"))
          break;
        paramText += "\n" + (nextLine.startsWith("* ") ? nextLine.slice(2) : nextLine.slice(1));
      }

      const param = paramText.match(/^\{([\s\S]+)\} (.+)$/);
      if (param)
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
    if (tag)
      tags.push(tag[1]);
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

    if (line == "/**" || line == "*/" || line.startsWith("* @") || line.startsWith("*"))
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
  JsDocInfo,
  JsDocParam,
  TaggedTarget,
  readJsDoc,
  readTaggedTargets
};
