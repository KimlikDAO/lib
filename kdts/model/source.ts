type SourceId = `package:${string}` | `module:${string}` | "global";

type Source = {
  id: SourceId,
  path: string
}

const removeOrigin = (source: SourceId): string =>
  source.slice(source.indexOf(":") + 1);

export { Source, SourceId, removeOrigin };
