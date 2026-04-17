import { bench } from "@kimlikdao/kdts/bench";
import { exp, exp2 } from "../../modular";

const Q = 0xDAD19B08F618992D3A5367F0E730B97C6DD113B6A2A493C9EDB0B68DBB1AEC020FB2A64C9644397AB016ABA5B40FA22655060824D9F308984D6734E2439BA08Fn;
const QQ = 0xE43EFFD0D073B6876F71618F0F3BDB81A73A64DD2291F563263EEEABA7121CA381F222ADCCC3C8C674AB74BD4B5DB36AB6D92A15E3D797B97BCB82A85AAC09E22DB7C7FE0373AEC07A38BB27FE46CB05F17DA98BFB3CF3DF932F985156B3A77D189456BC78D0FC5CD6A331A3F2D20EF1B73B98B97396CDBFE747FB95E53C4067n;

type Input = { x: bigint, M: bigint };

bench("512-bit exp(2, x, M) vs exp2(x, M)", {
  "exp": (x: bigint) => exp(2n, x, Q),
  "exp2": (x: bigint) => exp2(x, Q),
}, {
  repeat: 1000,
  dataset: [{ input: Q - 1n, output: 1n }]
});

bench("1024-bit exp(2, x, M) vs exp2(x, M)", {
  "exp": (x: bigint) => exp(2n, x, QQ),
  "exp2": (x: bigint) => exp2(x, QQ),
}, {
  repeat: 1000,
  dataset: [{ input: QQ - 1n, output: 1n }]
});
