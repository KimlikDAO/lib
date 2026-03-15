import { secrets } from "bun";

const Red = "\x1b[41m";
const Green = "\x1b[42m";
const Blue = "\x1b[44m";
const Clear = "\x1b[0m";

type CliArgs = Record<string, string | boolean | string[]>;

const parseArgs = (
  args: string[],
  defaultArgKey: string,
  shortArgMap: Record<string, string> = {}
): CliArgs => {
  let key: string = defaultArgKey;
  let values: string[] = [];
  const params: CliArgs = {};

  args.push("--");
  for (const arg of args) {
    if (arg.startsWith("-")) {
      params[key] = values.length
        ? (values.length == 1 ? values[0] : values)
        : true;
      key = arg.startsWith("--") ? arg.slice(2) : shortArgMap[arg] as string;
      values = [] as string[];
    } else
      values.push(arg)
  }
  return params;
}

const asList = (args: CliArgs, key: string): string[] => {
  const value = args[key];
  return value == undefined ? [] : typeof value == "string" ? [value] : value as string[];
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
  CliArgs,
  Green,
  Red,
  asList,
  getSecret,
  parseArgs
};
