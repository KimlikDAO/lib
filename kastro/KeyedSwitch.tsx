import dom from "./dom";
import { modify } from "../util/arrays";

class KeyedSwitch {
  private selectedPane: number;
  private initializers: ((() => void) | null)[];
  private keyToIndex: Record<string, number>;
  private root: HTMLDivElement;

  constructor({
    id,
    initialPane,
    children,
    keyToIndex,
  }: {
    id: string;
    initialPane?: string;
    children: ((() => void) | null)[];
    keyToIndex: Record<string, number>;
  }) {
    this.selectedPane = dom.GEN ? 0 : initialPane ? keyToIndex[initialPane] : 0;
    this.initializers = children;
    this.keyToIndex = keyToIndex;
    const Root = dom.div(id);
    this.root = Root;

    return (
      <Root modifiesChildren>
        {modify(children as unknown as HTMLElement[], (c: HTMLElement, i) => {
          c.nodisplay = initialPane ? c.key != initialPane : i != this.selectedPane;
          delete c.key;
        })}
      </Root>
    );
  }

  /**
   * Shows the child with the given key and hides the currently shown child.
   * If the child is being shown for the first time, initializes it.
   */
  showPane(key: string) {
    const idx = this.keyToIndex[key];
    const old = this.selectedPane;
    if (idx == old) return;
    const f = this.initializers[idx];
    if (f) {
      f();
      this.initializers[idx] = null;
    }
    this.selectedPane = idx;
    dom.show(this.root.children[idx]);
    dom.hide(this.root.children[old]);
  }
}

export default KeyedSwitch;
