import { getGlobals } from "@kimlikdao/lib/kastro/compiler/pageGlobals";
import { Script } from "@kimlikdao/lib/kastro/script";

export default (props) => {
  const globals = getGlobals();
  for (const key in props) {
    if (key.charCodeAt(0) < 91) globals[key] = props[key];
  }
  return Script({ ...props, src: "SOURCE" });
}
