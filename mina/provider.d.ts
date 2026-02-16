
interface SwitchChainArgs {
  readonly networkID: string;
}

interface ChainInfoArgs {
  readonly networkID: string;
}

interface SignMessageArgs {
  readonly message: string;
}

interface Signature {
  readonly field: string;
  readonly scalar: string;
}

interface SignedData {
  publicKey: string;
  data: string;
  signature: Signature;
}

interface ProviderError {
  message: string;
  code: number;
  data: unknown;
}

interface JsonMessageData {
  label: string;
  value: string;
}

interface SignJsonMessageArgs {
  message: JsonMessageData[];
}

interface FeePayer {
  fee: number;
  memo?: string;
}

interface SendTransactionArgs {
  onlySign?: boolean;
  transaction: string | Object;
  feePayer?: FeePayer;
}

interface SendTransactionHash {
  hash: string;
}

interface SignedZkappCommand {
  signedData: string;
}

type SendZkTransactionResult = SendTransactionHash | SignedZkappCommand;

interface Provider {
  getAccounts(): Promise<string[]>;
  requestAccounts(): Promise<string[]>;
  requestNetwork(): Promise<ChainInfoArgs>;
  signMessage(signMessageArgs: SignMessageArgs): Promise<SignedData>;
  switchChain(switchChainArgs: SwitchChainArgs): Promise<ChainInfoArgs>;
  signJsonMessage(jsonMessage: SignJsonMessageArgs): Promise<SignedData>;
  sendTransaction(sendTransactionArgs: SendTransactionArgs): Promise<SendZkTransactionResult>;
  on(eventName: string, handler: (data?: unknown) => void): void;
  isAuro?: boolean;
}

export {
  ChainInfoArgs,
  FeePayer,
  JsonMessageData,
  Provider,
  ProviderError,
  SendTransactionArgs,
  SendTransactionHash,
  SendZkTransactionResult,
  Signature,
  SignedData,
  SignedZkappCommand,
  SignJsonMessageArgs,
  SignMessageArgs,
  SwitchChainArgs
};
