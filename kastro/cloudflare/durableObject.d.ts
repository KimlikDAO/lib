interface DurableObjectId {
  toString(): string;
  equals(other: DurableObjectId): boolean;
}

interface DurableObjectStorage {
  get(key: string | string[]): Promise<unknown>;
  put(key: string | Record<string, unknown>, val?: unknown): Promise<void>;
  delete(key: string): Promise<boolean>;
  getAlarm(): Promise<number | undefined>;
  setAlarm(scheduledTime: number | Date): Promise<void>;
}

interface DurableObjectStubOptions {
  locationHint: string;
}

interface DurableObjectStub {
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
}

interface DurableObjectBinding {
  get(durableObjectId: DurableObjectId, options?: DurableObjectStubOptions): DurableObjectStub;
}

interface DurableObject {
  fetch(req: Request): Promise<Response>;
}

interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
}

interface DurableObjectState {
  id: DurableObjectId;
  storage: DurableObjectStorage;
  blockConcurrencyWhile(callback: () => Promise<unknown>): Promise<unknown>;
}
