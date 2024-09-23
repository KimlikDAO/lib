import { tagYaz } from "../util/html";

/**
 * TODO(KimlikDAO-bot): Add Release mode.
 * @param {*} param
 * @return {!Promise<string>}
 */
const Script = ({ BuildMode, Lang, loose, src, ...props }) => {
  return tagYaz("script", { type: "module", src }, false) + "</script>";
};

export { Script };
