import hash, { AssetHash } from "./hash";
import { Target } from "./target";

interface BundleReport {
  hostUrl?: string;
  namedAssets: Record<string, AssetHash>;
  piggybackAssets: Record<string, AssetHash>;
  hashedAssets: string[];
  bundleHash?: AssetHash;
}

const getEtags = (
  bundleReport: BundleReport
): Record<string, string> => {
  const namedAssets = bundleReport.namedAssets;
  const etags: Record<string, string> = {};
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

export { BundleReport, fromTarget, getEtags };
