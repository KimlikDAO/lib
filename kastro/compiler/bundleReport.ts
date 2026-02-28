import { AssetHash } from "./hash";

interface BundleReport {
  hostUrl?: string;
  namedAssets: Record<string, AssetHash>;
  piggybackAssets: Record<string, AssetHash>;
  hashedAssets: string[];
};

export {
  BundleReport
};
