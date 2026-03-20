import { StrHash } from "./hash.d";

interface Marker {
  contentHash: StrHash;
  depHash?: StrHash;
}

export { Marker };
