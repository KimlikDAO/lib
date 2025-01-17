import { EVM } from "@ethereumjs/evm";

const simulate = async (program) => {
  const evm = new EVM();

  evm.events.on("step", (data) => {
    console.log("memory:\t", data.memory);
    console.log("stack:\t", data.stack);
    console.log(data.opcode.name);
  })
  const results = await evm.runCode({ data: program, code: program });
  console.log("Gas used", results.executionGasUsed);
}

export { simulate };
