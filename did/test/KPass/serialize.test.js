import { describe, expect, test } from "bun:test";
import { MockSigner } from "../../../crosschain/mock/signer";
import { Signer } from "../../../crosschain/signer";
import vm from "../../../testing/vm";
import { SectionGroup, fromUnlockableNFT, toUnlockableNFT } from "../../KPass";

describe("`toUnlockableNFT()` tests", () => {
  test("serialize to / from unlockable NFT", () => {
    /** @const {!Signer} */
    const signer = new MockSigner(1337n);

    return toUnlockableNFT(/** @type {!eth.ERC721Metadata} */({
      name: "Halıcıoğlu NFT",
      description: "10.000 birbirinden özel NFT halı"
    }), /** @type {!did.DecryptedSections} */({
      "contactInfo": /** @type {!did.ContactInfo} */({
        email: "halı@halıcıoğlu.com",
        phone: "123456789"
      })
    }), [/** @type {!SectionGroup} */({
      userPrompt: "Halınızı açın",
      sectionNames: ["contactInfo"]
    })],
      signer,
      vm.addr(1337n)
    ).then((/** @type {!eth.ERC721Unlockable} */ nft) => fromUnlockableNFT(
      nft, ["contactInfo"], signer, vm.addr(1337n))
    ).then((/** @type {!did.DecryptedSections} */ decryptedSections) => {
      expect("contactInfo" in decryptedSections).toBeTrue();
      /** @const {!did.ContactInfo} */
      const contactInfo = /** @type {!did.ContactInfo} */(
        decryptedSections["contactInfo"]);
      expect(contactInfo.email).toBe("halı@halıcıoğlu.com");
      expect(contactInfo.phone).toBe("123456789");
    });
  });

  test("serialize to / from unlockable NFT with multiple sections", () => {
    /**
     * @type {!Signer}
     * @const
     */
    const signer = new MockSigner(1338n);

    return toUnlockableNFT(/** @type {!eth.ERC721Metadata} */({
      name: "Halıcıoğlu NFT",
      description: "10.000 birbirinden özel NFT halı"
    }), /** @type {!did.DecryptedSections} */({
      "contactInfo": /** @type {!did.ContactInfo} */({
        email: "halı@halıcıoğlu.com",
        phone: "123456789"
      }),
      "personInfo": /** @type {!did.PersonInfo} */({
        first: "Halıcı",
        last: "Halıcıoğlu"
      }),
    }), [/** @type {!SectionGroup} */({
      userPrompt: "Halınızı açın",
      sectionNames: ["contactInfo", "personInfo"]
    })],
      signer,
      vm.addr(1338n)
    ).then((/** @type {!eth.ERC721Unlockable} */ nft) => fromUnlockableNFT(
      nft, ["contactInfo", "personInfo"], signer, vm.addr(1338n))
    ).then((/** @type {!did.DecryptedSections} */ decryptedSections) => {
      expect(Object.keys(decryptedSections)).toEqual(["contactInfo", "personInfo"]);
      /** @const {!did.ContactInfo} */
      const contactInfo = /** @type {!did.ContactInfo} */(decryptedSections["contactInfo"]);
      /** @const {!did.PersonInfo} */
      const personInfo = /** @type {!did.PersonInfo} */(decryptedSections["personInfo"]);
      expect(contactInfo.email).toBe("halı@halıcıoğlu.com");
      expect(contactInfo.phone).toBe("123456789");
      expect(personInfo.first).toBe("Halıcı");
      expect(personInfo.last).toBe("Halıcıoğlu");
    });
  });
});
