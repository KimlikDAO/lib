import { readFile, rm, writeFile } from "node:fs/promises";
import hash from "./hash";
import { Marker } from "./marker.d";
import { Target } from "./target";

type TargetMarker = Pick<Target, "contentHash" | "depHash">;

const markerPath = (targetName: string): string =>
  `${targetName.slice(1)}.marker`;

const read = async (targetName: string): Promise<TargetMarker> => {
  const markerContent = await readFile(markerPath(targetName), "utf8");
  const marker = JSON.parse(markerContent) as Marker;
  const entry: TargetMarker = {
    contentHash: hash.fromStrHash(marker.contentHash),
  };
  if (marker.depHash)
    entry.depHash = hash.fromStrHash(marker.depHash);
  return entry;
};

const remove = (targetName: string): Promise<void> =>
  rm(markerPath(targetName), { force: true });

const write = async (
  targetName: string,
  target: TargetMarker
): Promise<TargetMarker> => {
  const marker: Marker = {
    contentHash: hash.toStr(target.contentHash)
  } as Marker;
  if (target.depHash != undefined)
    marker.depHash = hash.toStr(target.depHash);
  await writeFile(markerPath(targetName), JSON.stringify(marker));
  return target;
};

export default { read, remove, write };
