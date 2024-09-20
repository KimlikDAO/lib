import { tagYaz } from "../../util/html";

const Script = ({ BuildMode, Lang, DefaultChain, Chains, loose, src }) => {
  return tagYaz("script", { type: "module", src }, false) + "</script>";
};

export { Script };
