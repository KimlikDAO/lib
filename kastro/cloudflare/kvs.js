/**
 * Gets existing keys from CloudFlare KV.
 *
 * @return {Promise<Set<string>>}
 */
export const getExisting = (auth, namespaceId) =>
  fetch(`${CloudflareV4}/accounts/${auth.accountId}/storage/kv/namespaces/${namespaceId}/keys`, {
    headers: { "authorization": `Bearer ${auth.token}` }
  }).then((res) => res.json())
    .then((data) => new Set(data.result.map(x => x.name)));

export default { getExisting };
