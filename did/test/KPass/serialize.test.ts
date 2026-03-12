import { describe, expect, test } from "bun:test";
import { MockSigner } from "../../../crosschain/mock/signer";
import { ERC721MetaData } from "../../../ethereum/contract/ERC721.d";
import { addr as evmAddr } from "../../../ethereum/mock/signer";
import { SectionGroup, fromUnlockableNFT, toUnlockableNFT } from "../../KPass";
import { ContactInfo, DecryptedSections, PersonInfo } from "../../section.d";

describe("`toUnlockableNFT()` tests", () => {
  test("serialize to / from unlockable NFT", async () => {
    const signer = new MockSigner(1337n);

    const nft = await toUnlockableNFT(({
      name: "Halıcıoğlu NFT",
      description: "10.000 birbirinden özel NFT halı"
    }) as ERC721MetaData, ({
      "contactInfo": ({
        email: "halı@halıcıoğlu.com",
        phone: "123456789"
      }) as ContactInfo
    }) as DecryptedSections, [({
      userPrompt: "Halınızı açın",
      sectionNames: ["contactInfo"]
    }) as SectionGroup],
      signer,
      evmAddr(1337n)
    );
    const decryptedSections = await fromUnlockableNFT(
      nft, ["contactInfo"], signer, evmAddr(1337n));
    expect("contactInfo" in decryptedSections).toBeTrue();
    const contactInfo = decryptedSections["contactInfo"] as ContactInfo;
    expect(contactInfo.email).toBe("halı@halıcıoğlu.com");
    expect(contactInfo.phone).toBe("123456789");
  });

  test("serialize to / from unlockable NFT with multiple sections", async () => {
    const signer = new MockSigner(1338n);
    const nft = await toUnlockableNFT(({
      name: "Halıcıoğlu NFT",
      description: "10.000 birbirinden özel NFT halı"
    }) as ERC721MetaData, ({
      "contactInfo": ({
        email: "halı@halıcıoğlu.com",
        phone: "123456789"
      }) as ContactInfo,
      "personInfo": ({
        first: "Halıcı",
        last: "Halıcıoğlu"
      }) as PersonInfo,
    }) as DecryptedSections, [({
      userPrompt: "Halınızı açın",
      sectionNames: ["contactInfo", "personInfo"]
    }) as SectionGroup],
      signer,
      evmAddr(1338n)
    );
    const decryptedSections = await fromUnlockableNFT(
      nft, ["contactInfo", "personInfo"], signer, evmAddr(1338n));
    expect(Object.keys(decryptedSections)).toEqual(["contactInfo", "personInfo"]);
    const contactInfo = decryptedSections["contactInfo"] as ContactInfo;
    const personInfo = decryptedSections["personInfo"] as PersonInfo;
    expect(contactInfo.email).toBe("halı@halıcıoğlu.com");
    expect(contactInfo.phone).toBe("123456789");
    expect(personInfo.first).toBe("Halıcı");
    expect(personInfo.last).toBe("Halıcıoğlu");
  });
});
