import { LargeConstant } from "@kimlikdao/kdts";
import { ChainId } from "../crosschain/chains";
import { ERC721MetaData } from "../ethereum/contract/ERC721.d";
import KPass from "../ethereum/contract/KPass";
import hex from "../util/hex";
import { I18nString, LangCode } from "../util/i18n";
import { SectionGroup } from "./KPass";

const KIMLIKDAO_URL = "https://kimlikdao.org" satisfies LargeConstant;

const userPrompt = (sections: string[]): I18nString => {
  const sectionText = sections.join(",\n  ");
  return {
    [LangCode.EN]: `KPass Access Request:
-------------------------------------------------
When you sign this message, the connected app will have access to

  ${sectionText}

section${sections.length == 1 ? "" : "s"} of your KPass. Only sign this message if you would like to share this information.\n\n\n`,
    [LangCode.TR]: `KPass Erişim İsteği:
-------------------------------------------------
Bu mesajı imzaladığınızda, bağlı uygulama KPass’inizin

  ${sectionText}

bölüm${sections.length == 1 ? "ü" : "leri"}ne erişebilecek. Bu mesajı sadece bu bilgileri paylaşmak istiyorsanız imzalayın.\n\n\n`,
  };
}

const sectionGroup = (sections: string[], chainId: ChainId): SectionGroup => ({
  sectionNames: sections,
  userPrompt: userPrompt(sections)
    + "Nonce: " + hex.from(crypto.getRandomValues(new Uint8Array(8)) as Uint8Array)
    + "\nChainId: " + chainId
    + "\nNFT: " + KPass.contract
} as SectionGroup);

const metadataAndSections = (chainId: ChainId): { metadata: ERC721MetaData, sections: SectionGroup[] } => ({
  metadata: {
    name: "KPass",
    description: "KPass",
    image: KIMLIKDAO_URL + "/KPASS.svg",
    external_url: KIMLIKDAO_URL,
  } as ERC721MetaData,
  sections: [
    sectionGroup(["personInfo", "contactInfo", "addressInfo", "kütükBilgileri"], chainId),
    sectionGroup(["contactInfo", "humanID"], chainId),
    sectionGroup(["humanID"], chainId),
    sectionGroup(["exposureReport"], chainId)
  ]
});

const VerificationKeys: Record<string, string> = {
  "exposureReport":
    "MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAx6RG1FTAvyuNi4Hd5+o6muaVPgF12CN97J50" +
    "YHpHkcEfe3zYMnun/OT1o4fkPidoTgh7PbTOiPvsu6yTVenCjV3PCuwUoKniPCjq0sPMCOgQNTAsOjFg" +
    "vfz+5RQjJ8jUkmiG+qpg0XEM4KTIwHCG0x2QYdd+IaSO44/EYSbfStFxhSyk5Izdl7gff1V96eI/OFAV" +
    "xx0VGSVqP3yAFCCEHvOY+lXj+eYKr4gZymqKL2kmjP1FBAeetJHXdBJiU1uqot25hv3+xaKTriQENuAW" +
    "QZ+Zuy7J+1LXMvCmoE3VXToqOApYv1kCl3dzEB+XWeADAVJzEe5hphicmfUWi8+iKNSMlgwoxjvNugql" +
    "enTj41akWnhFCJkCnSJ3sIfGPUrqrd3CPmjdNFwZB0ZmdvhBC4irstxdd+ealyRYZUaepfzfy5QGV4fs" +
    "hvcfbkXh3aJkx9jFU5nIRBzCmXPO+mi1f5SOFJrKhxjOB93rj+x/wclaPF3a9HfKrifh7FsfSKVZxz8D" +
    "dtMClaKS6D3EyiqNOpYs0zC3kqOXkskA+MQsSsx9LahIOf/htOviEk41hMMMhtZ4kE52mngUEr1DnO9C" +
    "eknHqugo6ib4OZQwvoUtEk/pVXTNk/qlD+Mj4OoCHno1u3FN7xUj1BgYnRyvuvcON9AOHVDnNLTFzfue" +
    "LNFF/uUCAwEAAQ==",
  "humanID":
    "MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEApvX2Sq/3Ut+yppwZetr4pt+WKDhAVVYNIKaX" +
    "3MwMKU0UjJVAyXyjmmXhAcQf4oDTCYZt71OEZIPcuMf1joAaxyFThnSTimXJuhi6RvxPhRArWCCyod9F" +
    "GnGHjpspWNBOItajB1DEkg1KQs6lLSYPZT4Oo8T/gEejPuOYCQtmbWqjS/2ISJHIVss5oE9QAavWGWig" +
    "a36m16DGzEauaW17sAYRgV8Of7cv43UVIjlWBs4JWAG9m0ulv0l3Nk6qG60HD1G4K+XnS7yMnN1Uc5N5" +
    "cM7cOaT2C8O3CAyKb/E8LDKOD5tidxCtIsEFf+f9NTCBF5MuPeKa49zl1YVN3k9z6o48CNfHicP3oSOQ" +
    "4zWUgWxLcCGkdwnYVL9Sd6uESDQjZ8u4/zjCKfYofw6mXFH3lz7NJJcYhIa1VsYXuaHdUJqpIW/dj/qG" +
    "dBlYFdmBBJdItFe2EK/TslyqT2HpvC8uzkbGCZoxjfGpEfxzL0XnqOp8zjgENNzMvr2ZmdVQzObkH0QE" +
    "Q5bYPDdKjU+CjlIcVXBkUofXvFiuSDDZdpYpm2Gi86YZuAffeBg0/RWzxa4sfiSmyn4iC12atFB7hhvD" +
    "GytiV/f/fqhwRyQTNfeG5ljd6YylOEIRFXkPcYFayFvkK0MR8a7M+NS7nd8HZ1p4bEp7qlhFeyDYXoD8" +
    "8UtxBo8CAwEAAQ=="
};

export {
  metadataAndSections,
  userPrompt,
  VerificationKeys
};
