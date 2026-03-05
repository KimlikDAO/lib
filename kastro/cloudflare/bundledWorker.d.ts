import { KeyValue } from "./keyValue.d";
import { Env } from "./moduleWorker.d";

interface BundledWorkerEnv extends Env {
  K: KeyValue;
}

export { BundledWorkerEnv };
