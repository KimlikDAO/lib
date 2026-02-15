import { describe, expect, test } from "bun:test";
import { MockSigner } from "../../../crosschain/mock/signer";
import { Signer } from "../../../crosschain/signer";
import { ERC721MetaData, ERC721Unlockable } from "../../../ethereum/ERC721.d";
import { addr as evmAddr } from "../../../ethereum/mock/signer";
import { SectionGroup, fromUnlockableNFT, toUnlockableNFT } from "../../KPass";
import { ContactInfo, DecryptedSections, PersonInfo } from "../../section.d";

describe("`toUnlockableNFT()` tests", () => {
  test("serialize to / from unlockable NFT", () => {
    /** @const {Signer} */
    const signer = new MockSigner(1337n);

    return toUnlockableNFT(/** @type {ERC721MetaData} */({
      name: "Halıcıoğlu NFT",
      description: "10.000 birbirinden özel NFT halı"
    }), /** @type {DecryptedSections} */({
      "contactInfo": /** @type {ContactInfo} */({
        email: "halı@halıcıoğlu.com",
        phone: "123456789"
      })
    }), [/** @type {SectionGroup} */({
      userPrompt: "Halınızı açın",
      sectionNames: ["contactInfo"]
    })],
      signer,
      evmAddr(1337n)
    ).then((/** @type {ERC721Unlockable} */ nft) => fromUnlockableNFT(
      nft, ["contactInfo"], signer, evmAddr(1337n))
    ).then((/** @type {DecryptedSections} */ decryptedSections) => {
      expect("contactInfo" in decryptedSections).toBeTrue();
      /** @const {ContactInfo} */
      const contactInfo = /** @type {ContactInfo} */(
        decryptedSections["contactInfo"]);
      expect(contactInfo.email).toBe("halı@halıcıoğlu.com");
      expect(contactInfo.phone).toBe("123456789");
    });
  });

  test("serialize to / from unlockable NFT with multiple sections", () => {
    /**
     * @type {Signer}
     * @const
     */
    const signer = new MockSigner(1338n);

    return toUnlockableNFT(/** @type {ERC721MetaData} */({
      name: "Halıcıoğlu NFT",
      description: "10.000 birbirinden özel NFT halı"
    }), /** @type {DecryptedSections} */({
      "contactInfo": /** @type {ContactInfo} */({
        email: "halı@halıcıoğlu.com",
        phone: "123456789"
      }),
      "personInfo": /** @type {PersonInfo} */({
        first: "Halıcı",
        last: "Halıcıoğlu"
      }),
    }), [/** @type {SectionGroup} */({
      userPrompt: "Halınızı açın",
      sectionNames: ["contactInfo", "personInfo"]
    })],
      signer,
      evmAddr(1338n)
    ).then((/** @type {ERC721Unlockable} */ nft) => fromUnlockableNFT(
      nft, ["contactInfo", "personInfo"], signer, evmAddr(1338n))
    ).then((/** @type {DecryptedSections} */ decryptedSections) => {
      expect(Object.keys(decryptedSections)).toEqual(["contactInfo", "personInfo"]);
      /** @const {ContactInfo} */
      const contactInfo = /** @type {ContactInfo} */(decryptedSections["contactInfo"]);
      /** @const {PersonInfo} */
      const personInfo = /** @type {PersonInfo} */(decryptedSections["personInfo"]);
      expect(contactInfo.email).toBe("halı@halıcıoğlu.com");
      expect(contactInfo.phone).toBe("123456789");
      expect(personInfo.first).toBe("Halıcı");
      expect(personInfo.last).toBe("Halıcıoğlu");
    });
  });
});
