import { build } from "bun";
import { CliArgs } from "../../util/cli";
import { kdtsPlugin } from "../util/plugin";

const compile = async (args: CliArgs): Promise<string | void> => {
  const result = await build({
    entrypoints: [args.asStringOr("entry", "")],
    format: "esm",
    target: "bun",
    packages: "external",
    minify: true,
    plugins: [kdtsPlugin],
  });
  if (!result.success) {
    const messages = result.logs.map((l) => l.message).join("\n");
    throw `Bun build failed: ${messages}`;
  }
  const text = await result.outputs[0].text();
  console.log(`Bun size:\t${text.length}`);
  return text;
};

export { compile };
