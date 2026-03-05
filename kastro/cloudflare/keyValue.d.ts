interface KeyValueList {
  keys: { name: string; metadata: unknown }[];
  list_complete: boolean;
  cursor: string;
}

interface KeyValue {
  get(key: string, type?: string): Promise<ArrayBuffer>;
  put(key: string, value: string | ArrayBuffer, options?: { metadata: unknown }): Promise<void>;
  delete(key: string): Promise<void>;
  list(): Promise<KeyValueList>;
}

export { KeyValue, KeyValueList };
