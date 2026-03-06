import { KvBinding } from "./keyValues.d";

interface WorkerUploadMetadata {
  main_module: string;
  compatibility_date: string;
  bindings?: KvBinding[];
}

export { WorkerUploadMetadata };
