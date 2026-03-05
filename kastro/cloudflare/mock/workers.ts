import type { Auth } from "../api";

const upload = async (
  _auth: Auth,
  _name: string,
  _code: string | ArrayBuffer,
  _kvBindings?: unknown[],
  _bundleFiles?: Record<string, ArrayBuffer>
): Promise<unknown> => ({ success: true });

export default { upload };
