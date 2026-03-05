import { Env } from "./moduleWorker.d";
import { KeyValue } from "./keyValue.d";

interface BundledWorkerEnv extends Env {
  K: KeyValue;
}

export { BundledWorkerEnv };
