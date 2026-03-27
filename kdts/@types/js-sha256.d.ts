interface Sha256 {
  array(message: string | number[] | ArrayBuffer | Uint8Array): number[];
}

export var sha256: Sha256;
