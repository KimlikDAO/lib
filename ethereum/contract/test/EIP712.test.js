import { describe, expect, test } from "bun:test";
import {
  domainSeparator,
  encodeType,
  structHash,
  typedDataHash,
  typeHash
} from "../EIP712";
import {
  EIP712DomainData,
  EIP712TypedData,
  EIP712TypeRegistry
} from "../EIP712.d";

const TypeRegistry = /** @type {EIP712TypeRegistry} */({
  "Permit": [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" }
  ],
  "PermitBatch": [
    { name: "permit", type: "Permit" },
    { name: "batchId", type: "uint256" }
  ],
  "Person": [
    { name: "name", type: "string" },
    { name: "wallet", type: "address" }
  ],
  "Mail": [
    { name: "from", type: "Person" },
    { name: "to", type: "Person" },
    { name: "contents", type: "string" }
  ],
});

const Domain = /** @type {EIP712DomainData} */({
  name: "Ether Mail",
  version: "1",
  chainId: 1,
  verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
});

/** @type {Record<string, unknown>} */
const Message = {
  "from": {
    "name": "Cow",
    "wallet": "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
  },
  "to": {
    "name": "Bob",
    "wallet": "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
  },
  "contents": "Hello, Bob!"
};

describe("Permit(owner, spender, value, nonce, deadline)", () => {
  test("encodeType", () => {
    expect(encodeType("Permit", TypeRegistry))
      .toBe("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
  });
  test("typeHash", () => {
    expect(typeHash("Permit", TypeRegistry))
      .toBe("6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9");
  });
});

describe("PermitBatch(permit, batchId)", () => {
  test("encodeType", () => {
    expect(encodeType("PermitBatch", TypeRegistry))
      .toBe("PermitBatch(Permit permit,uint256 batchId)" +
        "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
  });
  test("typeHash", () => {
    expect(typeHash("PermitBatch", TypeRegistry))
      .toBe("70d0c1475ecdfdbecc15c092246eb4c30fd82d216a5d9c3bc7f73ca0ed552ce0");
  });
});

describe("Mail(from, to, contents)", () => {
  test("encodeType", () => {
    expect(encodeType("Mail", TypeRegistry))
      .toBe("Mail(Person from,Person to,string contents)Person(string name,address wallet)");
  });
  test("typeHash", () => {
    expect(typeHash("Mail", TypeRegistry))
      .toBe("a0cedeb2dc280ba39b857546d74f5549c3a1d7bdc2dd96bf881f76108e23dac2");
  });

  test("structHash Mail", () => {
    expect(structHash(Message, "Mail", TypeRegistry))
      .toBe("c52c0ee5d84264471806290a3f2c4cecfc5490626bf912d01f240d7a274b371e");
  });
});

test("EtherMail domain", () => {
  expect(domainSeparator(Domain))
    .toBe("f2cee375fa42b42143804025fc449deafd50cc031ca257e0b194a650a912090f");
});

test("typedDataHash", () => {
  expect(typedDataHash(/** @type {EIP712TypedData} */({
    types: TypeRegistry,
    primaryType: "Mail",
    domain: Domain,
    message: Message
  })))
    .toBe("be609aee343fb3c4b28e1df9e632fca64fcfaede20f02e86244efddf30957bd2");
});
