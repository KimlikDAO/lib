type SourceId = `package:${string}` | `module:${string}` | "global";

type Source = {
  id: SourceId,
  path: string
}

export { Source, SourceId };
