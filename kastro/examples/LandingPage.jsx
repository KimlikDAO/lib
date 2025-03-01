import dom from "@kimlikdao/util/dom";
import { LangCode } from "@kimlikdao/util/i18n";
import ArrowSvg from "./arrow.svg";
import Css from "./LandingPage.css";

/**
 * @param {{ Lang: LangCode }} props
 */
const LandingPage = ({ Lang }) => {
  /** @const {!HTMLButtonElement} */
  const Button = dom.button(Css.ButtonId);
  /** @const {!HTMLSpanElement} */
  const Text = dom.span(Css.TextId);

  return (
    <html lang={Lang}>
      <Css />
      <Button onClick={() => dom.text.update(Text, "Clicked!")}>
        Click here!<ArrowSvg />
      </Button>
      <Text>Hello World!</Text>
    </html>
  );
};

export default LandingPage;
