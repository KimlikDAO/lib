
class CfRequest extends Request {
  cf: { clientAcceptEncoding?: string }
}

interface Env {};

interface ModuleWorker {
  fetch(req: CfRequest, env?: Env): Promise<Response> | Response;
}

export { CfRequest, ModuleWorker, Env };
