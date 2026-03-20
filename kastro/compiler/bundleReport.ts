import hash from "./hash";
import { StrHash } from "./hash.d";
import { Target } from "./target";

type HashedName = `${StrHash}.${"html" | "js" | "css" | "txt" | "svg" | "webp" | "ttf" | "woff2"}`;

type GivenName = string;

type BundleName = HashedName | GivenName;

interface BundleReport {
  hostUrl?: string;
  namedAssets: Record<GivenName, HashedName>;
  piggybackAssets: Record<string, BundleName>;
  hashedAssets: HashedName[];
  bundleHash?: StrHash;
}

const getEtags = (
  bundleReport: BundleReport
): Record<GivenName, StrHash> => {
  const namedAssets = bundleReport.namedAssets;
  const etags: Record<GivenName, StrHash> = {};
  for (const key in namedAssets) {
    const val = namedAssets[key];
    const dot = val.lastIndexOf(".");
    etags[key] = dot == 0 ? val : val.slice(0, dot);
  }
  return etags;
};

const fromTarget = (target: Target): BundleReport => {
  const bundleReport = JSON.parse(
    new TextDecoder().decode(target.content),
  ) as BundleReport;
  bundleReport.bundleHash = hash.toStr(target.contentHash);
  return bundleReport;
};

export {
  BundleName,
  BundleReport,
  GivenName,
  HashedName,
  fromTarget,
  getEtags
};
