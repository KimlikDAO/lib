import { Overridable } from "@kimlikdao/kdts";
import { LangCode, localize } from "../util/i18n";
import { TextElement } from "./dom.d";

const GEN: boolean = true satisfies Overridable;
const Lang: LangCode = LangCode.EN satisfies Overridable;

const IsChrome = navigator.userAgent.toLowerCase().includes("chrome");

/** @satisfies {PureFn} */
const i18n = <T>(i18ned: Record<LangCode, T>): T => i18ned[Lang];

/** @satisfies {PureFn & NoInlineFn} */
const byId = (id: string): HTMLElement =>
  document.getElementById(id) as HTMLElement;

/** @satisfies {NoInlineFn} */
const hide = (element: Element) => {
  (element as HTMLElement).style.display = "none";
}

/** @satisfies {NoInlineFn} */
const show = (element: Element, show = true) => {
  (element as HTMLElement).style.display = show ? "" : "none";
}

/** @satisfies {NoInlineFn} */
const hideById = (id: string) => { byId(id).style.display = "none"; }

const showById = (id: string, isVisible?: boolean) => show(byId(id), isVisible);

const text = {
  update(element: Element, text: string): string {
    return (element.firstChild as Text).data = text;
  },

  setPreserve(element: HTMLElement, text?: string) {
    const textElement = element as TextElement;
    const textNode = element.firstChild as Text;
    const preserved = textElement.o;
    if (!preserved) {
      if (!text) return;
      textElement.o = textNode.data;
    }
    textNode.data = (text || preserved) as string;
  },

  appendPreserve: (element: HTMLElement, text: string) => {
    const textElement = element as TextElement;
    const textNode = element.firstChild as Text;
    let preserved = textElement.o;
    if (!preserved)
      textElement.o = preserved = textNode.data;
    textNode.data = preserved + text;
  }
}

const bindDropdown = (trigger: HTMLElement, panel: HTMLElement) => {
  panel.classList.add("nsh");
  panel.style.display = "";
  trigger.ontouchstart =
    panel.ontouchstart = (event) => event.stopPropagation();
  const hidePanel = () => {
    window["ontouchstart"] = window.onclick = null;
    trigger.classList.remove("sel");
    panel.classList.add("nsh");
  }
  trigger.onclick = (event: Event | null) => {
    panel.classList.remove("nsh");
    trigger.classList.add("sel");
    const f = window.onclick;
    if (f && event) f.call(window, event as PointerEvent);
    if (f !== hidePanel)
      window.onclick = window["ontouchstart"] = hidePanel;
    event?.stopPropagation();
  }
}

const slideCard = (cardContainer: HTMLElement, index: number) => {
  const width = cardContainer.children[0].getBoundingClientRect().width;
  cardContainer.style.transform = `translate3d(-${index * width}px,0,0)`;
}

const showPopup = (url: string, width: number, height: number) => {
  const left = window.screenX + window.outerWidth - width;
  const p = window.open(url, "_blank",
    `menubar=no,toolbar=no,status=no,width=${width},height=${height},` +
    `left=${left},top=${window.screenY}`
  );
  if (p) p.focus();
}

/** @satisfies {PureFn} */
const renderCurrency = (amount: number): string =>
  (amount / 1_000_000).toLocaleString(Lang);

/** @satisfies {PureFn} */
const renderPhone = (phone: string): string =>
  phone.slice(0, 3) + " (" + phone.slice(3, 6) + ") " + phone.slice(6, 9) + " " +
  phone.slice(9, 11) + " " + phone.slice(11);

const create = (id: string, name: string): HTMLElement => {
  const el = document.createElement(name);
  el.id = id;
  return el as HTMLElement;
}

/** @satisfies {PureFn} */
const a = (id: string): HTMLAnchorElement => ((GEN && "GEN" in globalThis)
  ? create(id, "a")
  : byId(id)) as HTMLAnchorElement;

/** @satisfies {PureFn} */
const button = (id: string): HTMLButtonElement => ((GEN && "GEN" in globalThis)
  ? create(id, "button")
  : byId(id)) as HTMLButtonElement;

/** @satisfies {PureFn} */
const form = (id: string): HTMLFormElement => ((GEN && "GEN" in globalThis)
  ? create(id, "form")
  : byId(id)) as HTMLFormElement;

/** @satisfies {PureFn} */
const span = (id: string): HTMLSpanElement => ((GEN && "GEN" in globalThis)
  ? create(id, "span")
  : byId(id)) as HTMLSpanElement;

/** @satisfies {PureFn} */
const div = (id: string): HTMLDivElement => ((GEN && "GEN" in globalThis)
  ? create(id, "div")
  : byId(id)) as HTMLDivElement;

/** @satisfies {PureFn} */
const img = (id: string): HTMLImageElement => ((GEN && "GEN" in globalThis)
  ? create(id, "img")
  : byId(id)) as HTMLImageElement;

/** @satisfies {PureFn} */
const ul = (id: string): HTMLUListElement => ((GEN && "GEN" in globalThis)
  ? create(id, "ul")
  : byId(id)) as HTMLUListElement;

/** @satisfies {PureFn} */
const li = (id: string): HTMLLIElement => ((GEN && "GEN" in globalThis)
  ? create(id, "li")
  : byId(id)) as HTMLLIElement;

/** @satisfies {PureFn} */
const td = (id: string): HTMLTableCellElement => ((GEN && "GEN" in globalThis)
  ? create(id, "td")
  : byId(id)) as HTMLTableCellElement;

/** @satisfies {PureFn} */
const input = (id: string): HTMLInputElement => ((GEN && "GEN" in globalThis)
  ? create(id, "input")
  : byId(id)) as HTMLInputElement;

const schedule = (f: () => void, ms: number): void => {
  if (!(GEN && "GEN" in globalThis)) setTimeout(f, ms);
};

const run = (f: () => void) => (GEN && "GEN" in globalThis) ? {} : f();

export default {
  GEN,
  Lang,
  IsChrome,
  // Elements
  a,
  button,
  div,
  form,
  img,
  input,
  li,
  span,
  ul,
  td,
  // DOM manipulation
  byId,
  showById,
  hideById,
  show,
  hide,
  text,
  // Widgets
  bindDropdown,
  showPopup,
  slideCard,
  // Render
  i18n,
  localize,
  renderCurrency,
  renderPhone,
  // Scheduling
  schedule,
  run,
};
