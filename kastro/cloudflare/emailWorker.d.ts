interface EmailMessage {
  from: string;
  to: string;
  headers: Headers;
  raw: ReadableStream;
  rawSize: number;

  forward(rcptTo: string, headers?: Headers): Promise<void>;
  setReject(reason: string): void;
}

interface EmailWorker {
  email(message: EmailMessage, env: Env): Promise<void> | void;
}

export { EmailMessage, EmailWorker };
