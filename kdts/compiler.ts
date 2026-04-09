import * as swc from "@swc/core";
import { write } from "bun";
import UglifyJS, { CompressOptions, MinifyOptions } from "uglify-js";
import { CliArgs, CliArgValue } from "../util/cli";
import { replaceExt } from "../util/paths";
import { compile as compileWithBun } from "./bun/compile";
import { compile as compileWithGcc } from "./gcc/compile";

const UglifyOptions: MinifyOptions = {
  mangle: { toplevel: true },
  toplevel: true,
  compress: {
    module: true,
    toplevel: true,
    passes: 10,
    unsafe: true,
    drop_console: false, // overridden per call from params["nologs"]
  },
  warnings: "verbose",
};

const SwcMinifyOptions = {
  module: true,
  ecma: 2022,
  sourceMap: false,
  toplevel: true,
  mangle: true,
  compress: {
    passes: 10,
    pure_getters: true,
    unsafe: true,
    unsafe_proto: true,
    reduce_vars: true,
  },
};

const finalize = async (
  code: string,
  args: CliArgs,
): Promise<string> => {
  const dropConsole = args.isTrue("nologs");
  (UglifyOptions.compress as CompressOptions).drop_console = dropConsole;
  (SwcMinifyOptions.compress as CompressOptions).drop_console = dropConsole;
  const uglified = UglifyJS.minify(code, UglifyOptions);
  if (uglified.error)
    throw uglified.error;
  const uglifiedCode = uglified.code;
  const swcOutput = await swc.minify(uglifiedCode, SwcMinifyOptions);
  let result = uglifiedCode.length < swcOutput.code.length
    ? uglifiedCode : swcOutput.code;

  console.log(`Uglified size:  ${uglifiedCode.length}`);
  console.log(`SWC size:       ${swcOutput.code.length}`);
  if (args.isTrue("print"))
    console.log("UglifyJS output:\n", uglifiedCode, "\nSWC output:\n", swcOutput.code);
  const output = args.asStringOr("output", "");
  if (output)
    await write(output, result);
  return result;
};

type CompileParams = Record<string, CliArgValue> | CliArgs;

type TranspileFn = (content: string, file: string, isEntry?: boolean) =>
  string | null;

const compile = async (
  params: CompileParams,
  checkFreshFn?: (deps: string[]) => Promise<boolean>,
  transpileFn?: TranspileFn
): Promise<string | void> => {
  if (!(params instanceof CliArgs))
    params = new CliArgs(params);

  const target = params.asList("target");
  params.setIfMissing("entry", target[0] == "compile" ? target[1] : target[0]);
  params.setIfMissing("output", replaceExt(params.asStringOr("entry", ""), ".out.js"));
  const compiled = await (params.isTrue("fast")
    ? compileWithBun(params, checkFreshFn)
    : compileWithGcc(params, checkFreshFn, transpileFn));
  if (!compiled) return;
  return finalize(compiled, params);
};

export { compile, TranspileFn };
