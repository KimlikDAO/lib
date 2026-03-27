interface Process {
  exit(exitCode: number): void;
  cwd(): string;
  on(eventType: string, handler: (event: unknown) => void): void;
  argv: string[];
  env: Record<string, string>;
  exitCode: number;
}

declare var process: Process;

export default process;
