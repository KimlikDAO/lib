import { shuffle } from "@kimlikdao/lib/util/arrays";
import hex from "@kimlikdao/lib/util/hex";
import { JsonRpcProvider, TransactionResponse, Wallet } from "ethers";
import { SZABO, batchSendWithKPassNoPush0 } from "../builder";

/**
 * @see https://twitter.com/szaglam/status/1747956442248671703
 *
 * @const
 * @type {AddressWithKPass[]}
 */
const Addys = [
  { addr: "0xFAE7b13B8D653E2D603Bf63950F37E1b23eCf148", kpass: true },
  { addr: "0xbe4a88460ce03492ff55c0eed016dd2536b9fda2", kpass: true },
  { addr: "0x218ee4d9F2598f6b0deA19899B859163416E8499", kpass: false },
  { addr: "0x5304eA777B594AFEa13717cf625E96263Cb86066", kpass: true },
  { addr: "0xF1FD2aa4967180d425023d91D2CdC77662b66248", kpass: true },
  { addr: "0x3057C40FcAF61A8E908F74C7a25cF12226A1B46D", kpass: true },
  { addr: "0x4912b34f6d811f49ab516bf1d7caa28c14f22ce7", kpass: false },
  { addr: "0x903CC03737CBA17C2D60CdA7d3Eb3a5Fb0AfaCa7", kpass: false },
  { addr: "0xC34E4E5C3DC4544556902cb44A916f0761087b3D", kpass: false },
  { addr: "0xbC8Ae4Be25e557cC1A4B0102b01cF4A61339E7a3", kpass: true },
  { addr: "0x5B7bD5305f7EC4beD2b9321117c54ed4c4c179E9", kpass: false },
  { addr: "0xe6Cf14A1DE1874B0cc7aFD6d3b1036d66a3B8376", kpass: false },
  { addr: "0xF6369D2285f4ca136bde23BfA60bc3A8B3E7f593", kpass: false },
  { addr: "0x479F37f12459810c2309AB95D3E14bbA340B1021", kpass: false },
  { addr: "0x636365C3e4d249ef15fCa3502a677f720720a904", kpass: false },
  { addr: "0xA9DcE14829993110573a47c10D6f7502967cA577", kpass: false },
  { addr: "0x766b3a974A296990E5d7FDe6EBD88befa69754d5", kpass: false },
  { addr: "0x1934DB048920332bAC5c4011B887Ac5FD7615eCb", kpass: false },
  { addr: "0x7B892cfF3b8748113a72c359e268B0AA9453844f", kpass: false },
];

/**
 * @return {Promise<TransactionResponse>}
 */
const send = () => {
  const { code, valueSzabos } = batchSendWithKPassNoPush0(
    shuffle(Addys).slice(0, 16), 32_000_000, 16_000_000);

  /**
   * @const
   * @type {JsonRpcProvider}
   */
  const provider = new JsonRpcProvider("https://rpc.ftm.tools");
  /** @const {!Wallet} */
  const wallet = new Wallet(process.argv[2], provider);

  return wallet.sendTransaction({
    value: BigInt(valueSzabos) * SZABO,
    data: "0x" + hex.from(code),
  });
}

await send().then(console.log);
