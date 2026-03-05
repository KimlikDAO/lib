import type { Auth } from "../api";

const uploadNewKeys = async (
  _auth: Auth,
  _namespaceId: string,
  entries: Record<string, ArrayBuffer>
): Promise<{ uploaded: string[] }> => ({
  uploaded: Object.keys(entries)
});

export default { uploadNewKeys };
