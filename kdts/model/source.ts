type SourceId = `package:${string}` | `module:${string}` | "global";

type Source = {
  id: SourceId,
  path: string
}

class SourceSet {
  private readonly bySource = new Map<SourceId, Source>();
  private readonly pending: SourceId[] = [];

  add(resolved: Source) {
    if (this.bySource.has(resolved.id))
      return;
    this.bySource.set(resolved.id, resolved);
    this.pending.push(resolved.id);
  }
  pop(): Source | undefined {
    const source = this.pending.pop();
    if (!source) return;
    return this.bySource.get(source)!;
  }
  getPaths(): string[] {
    return Array.from(this.bySource.values(), ({ path }) => path).sort();
  }
}

export { Source, SourceId, SourceSet };
