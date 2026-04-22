import { secrets } from "bun";

const Red = "\x1b[41m";
const Green = "\x1b[42m";
const Blue = "\x1b[44m";
const Clear = "\x1b[0m";

type CliArgValue = boolean | string | string[] | Record<string, unknown>;
type CliArgData = string[] | Record<string, unknown>;

class CliArgs {
  constructor(private map: Record<string, CliArgData>) { }

  static fromArgv(
    argv: string[],
    defaultKey: string,
    shortKeyMap: Record<string, string>
  ): CliArgs {
    let key: string = defaultKey;
    let values: string[] = [];
    const map: Record<string, string[]> = {};

    const args = argv.slice(2);
    args.push("--");
    for (const arg of args) {
      if (arg.startsWith("-")) {
        map[key] = (map[key] || []).concat(values);
        key = arg.startsWith("--") ? arg.slice(2) : shortKeyMap[arg] as string;
        values = [];
      } else
        values.push(arg);
    }
    return new CliArgs(map);
  }

  static from(entries: Record<string, CliArgValue> | CliArgs): CliArgs {
    if (entries instanceof CliArgs)
      return entries;

    const map: Record<string, CliArgData> = {};
    for (const key in entries)
      map[key] = CliArgs.toData(entries[key]!);
    return new CliArgs(map);
  }

  private static toData(value: CliArgValue): CliArgData {
    if (typeof value == "boolean")
      return value ? [] : ["false"];
    if (typeof value == "string")
      return [value];
    if (Array.isArray(value))
      return value.slice();
    return value;
  }

  asList(key: string): string[] {
    const value = this.map[key];
    return Array.isArray(value) ? value : [];
  }
  asStringOr(key: string, or: string): string {
    const value = this.map[key];
    return Array.isArray(value) && value.length ? value[0] as string : or;
  }
  asRecord(key: string): Record<string, unknown> {
    const value = this.map[key];
    if (value && !Array.isArray(value))
      return value;
    if (value?.length != 1)
      return {};
    return JSON.parse(value[0]!) as Record<string, unknown>;
  }
  isTrue(key: string): boolean {
    const value = this.map[key];
    return Array.isArray(value) &&
      (!value.length || (value[0] as string).toLowerCase() != "false");
  }
  setIfMissing(key: string, value: CliArgValue): CliArgValue {
    return this.map[key] ||= CliArgs.toData(value);
  }
  fork(entries: Record<string, CliArgValue>): CliArgs {
    return CliArgs.from({ ...this.map, ...entries });
  }
}

const getSecret = async (
  service: string,
  key: string
): Promise<string> => {
  let value = await secrets.get({ service, name: key });
  if (!value) {
    value = prompt(`Enter your ${key}`);
    if (!value) throw `Missing ${key}`;
    await secrets.set({ service, name: key, value });
  }
  return value;
}

export {
  Blue,
  Clear,
  CliArgValue,
  CliArgs,
  Green,
  Red,
  getSecret
};
