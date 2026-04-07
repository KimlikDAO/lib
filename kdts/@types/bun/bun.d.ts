type BunSecretsOptions = {
  service: string;
  name: string;
  value?: string;
};

interface BunSecrets {
  get(options: BunSecretsOptions): Promise<string | null>;
  set(options: BunSecretsOptions): Promise<void>;
  delete(options: BunSecretsOptions): Promise<boolean>;
}

export var secrets: BunSecrets;

export function deepEquals<T>(a: T, b: T, strict?: boolean): boolean;

/** Returns a 64 bit Wyhash hash of the data. */
export function hash(data: Uint8Array | string): bigint;
