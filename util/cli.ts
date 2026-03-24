import { secrets } from "bun";

const Red = "\x1b[41m";
const Green = "\x1b[42m";
const Blue = "\x1b[44m";
const Clear = "\x1b[0m";

type CliArgValue = boolean | string | string[] | Record<string, unknown>;

class CliArgs {
  constructor(private map: Record<string, CliArgValue>) { }

  asList(key: string): string[] {
    const value = this.map[key];
    return typeof value == "string"
      ? [value]
      : Array.isArray(value) ? value : [];
  }

  asStringOr(key: string, or: string): string {
    const value = this.map[key];
    return typeof value == "string" ? value :
      Array.isArray(value) ? (value as string[])[0] : or;
  }

  asRecord(key: string): Record<string, unknown> {
    const value = this.map[key];
    if (typeof value == "string")
      return JSON.parse(value) as Record<string, unknown>;
    if (Array.isArray(value) || typeof value == "boolean")
      return {};
    return value;
  }

  isTrue(key: string): boolean {
    const value = this.map[key];
    return typeof value == "boolean" ? value :
      typeof value == "string" && value.toLowerCase() != "false";
  }

  setIfMissing(key: string, value: CliArgValue): CliArgValue {
    return this.map[key] ||= value;
  }

  fork(entries: Record<string, CliArgValue>): CliArgs {
    return new CliArgs({ ...this.map, ...entries });
  }
}

const parseArgs = (
  args: string[],
  defaultArgKey: string,
  shortArgMap: Record<string, string> = {}
): CliArgs => {
  let key: string = defaultArgKey;
  let values: string[] = [];
  const map: Record<string, boolean | string | string[]> = {};

  args.push("--");
  for (const arg of args) {
    if (arg.startsWith("-")) {
      map[key] = values.length
        ? (values.length == 1 ? values[0] : values)
        : true;
      key = arg.startsWith("--") ? arg.slice(2) : shortArgMap[arg] as string;
      values = [] as string[];
    } else
      values.push(arg)
  }
  return new CliArgs(map);
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
  getSecret,
  parseArgs
};
