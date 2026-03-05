/**
 * Mock compiler for cloudflare deploy tests.
 * buildTarget returns a minimal worker script content.
 */
const BuildMode = { Dev: 0, Compiled: 1, Release: 2 };

async function buildTarget(_targetName: string, _props: Record<string, unknown>) {
  const content = new TextEncoder().encode("export default { fetch: () => new Response('ok') };");
  return {
    content,
    contentHash: new Uint8Array(32).fill(0)
  };
}

export default { BuildMode, buildTarget };
