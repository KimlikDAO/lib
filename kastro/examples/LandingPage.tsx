import dom from "@kimlikdao/kastro/dom";
import { LangCode } from "@kimlikdao/lib/util/i18n";
import ArrowSvg from "./arrow.svg";
import Css from "./LandingPage.css";

const LandingPage = ({ Lang }: { Lang: LangCode }) => {
  const Button = dom.button(Css.Button);
  const Text = dom.span(Css.Text);

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
