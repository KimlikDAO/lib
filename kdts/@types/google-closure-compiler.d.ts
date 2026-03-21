export type CompileOption = string | boolean;
export type CompileOptions =
  string[] |
  Record<string, CompileOption | CompileOption[]>;

export interface CompilerInstance {
  spawnOptions: Record<string, string>;
  run(callback: (exitCode: number, stdout: string, stderr: string) => void): void;
}

export class compiler implements CompilerInstance {
  constructor(opts: CompileOptions | string[], extraCommandArgs?: string[]);
  spawnOptions: Record<string, string>;
  run(callback: (exitCode: number, stdout: string, stderr: string) => void): void;
}

export default compiler;
