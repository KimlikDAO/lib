export interface CompressOptions {
  annotations?: boolean;
  drop_console?: boolean;
  module?: boolean;
  passes?: number;
  pure_getters?: boolean | "strict";
  reduce_vars?: boolean;
  toplevel?: boolean;
  unsafe?: boolean;
  unsafe_proto?: boolean;
}

export interface MangleOptions {
  toplevel?: boolean;
}

export interface OutputOptions {
  annotations?: boolean;
}

export interface MinifyOptions {
  annotations?: boolean;
  compress?: false | CompressOptions;
  mangle?: boolean | MangleOptions;
  output?: OutputOptions;
  toplevel?: boolean;
  warnings?: boolean | "verbose";
}

export interface MinifyOutput {
  code: string;
  error?: Error;
  warnings?: string[];
}

export function minify(input: string, options?: MinifyOptions): MinifyOutput;

declare const UglifyJS: {
  minify: typeof minify;
};

export default UglifyJS;
