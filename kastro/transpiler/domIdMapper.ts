import { hash } from "bun";

interface DomIdMapper {
  map(namespace: string, context: string, domId: string): string;
  preserve(namespace: string, domId: string): string;
}

const indexToMinified = (index: number): string => {
  let result = "";
  const firstChar = index % 52;
  result += String.fromCharCode(firstChar + (firstChar < 26 ? 65 : 71));
  index = (index / 52) | 0;

  while (index > 0) {
    index--;
    const c = index % 64;
    const charCode = c < 52
      ? c + (c < 26 ? 65 : 71)
      : c < 62 ? c - 4 : c == 62 ? 95 : 45;
    result = String.fromCharCode(charCode) + result;
    index = (index / 64) | 0;
  }
  return result;
};

const hashKey = (key: string): string =>
  "K" + hash(key).toString(36);

class GlobalMapper implements DomIdMapper {
  private readonly namespaceToNext = new Map<string, number>();
  private readonly keyToIndex = new Map<string, number>();
  private readonly minifiedIds = new Set<string>();

  constructor() {
    this.preserve("mpa", "ndp");
    this.preserve("mpa", "nsh");
    this.preserve("mpa", "sel");
    this.preserve("mpa", "dis");
  }

  map(namespace: string, context: string, domId: string): string {
    if (this.minifiedIds.has(namespace + domId)) return domId;
    const key = hashKey(`${context}#${domId}`);
    let index = this.keyToIndex.get(namespace + key);
    if (index == undefined) {
      index = this.namespaceToNext.get(namespace) ?? 0;
      while (this.minifiedIds.has(namespace + indexToMinified(index))) ++index;
      this.namespaceToNext.set(namespace, index);
      this.keyToIndex.set(namespace + key, index);
    }
    const minifiedId = indexToMinified(index);
    this.minifiedIds.add(namespace + minifiedId);
    return minifiedId;
  }

  preserve(namespace: string, domId: string): string {
    this.minifiedIds.add(namespace + domId);
    return domId;
  }
}

class LocalMapper implements DomIdMapper {
  private readonly hashToNext = new Map<string, number>();
  private readonly keyToIndex = new Map<string, number>();
  private readonly minifiedIds = new Set<string>();

  map(_namespace: string, context: string, domId: string): string {
    if (this.minifiedIds.has(domId)) return domId;
    const hash = hashKey(context);
    const key = `${hash}${domId}`;
    let index = this.keyToIndex.get(key);
    if (index == undefined) {
      index = this.hashToNext.get(hash) ?? 0;
      this.hashToNext.set(hash, index + 1);
      this.keyToIndex.set(key, index);
    }
    const minifiedId = hash + indexToMinified(index);
    this.minifiedIds.add(minifiedId);
    return minifiedId;
  }

  preserve(_namespace: string, domId: string): string {
    this.minifiedIds.add(domId);
    return domId;
  }
}

class BasicMapper implements DomIdMapper {
  map(namespace: string, context: string, domId: string): string {
    return hashKey(`${namespace}#${context}#${domId}`);
  }

  preserve(_namespace: string, domId: string): string {
    return domId;
  }
}

export {
  DomIdMapper,
  GlobalMapper,
  indexToMinified,
  LocalMapper,
  BasicMapper
};
