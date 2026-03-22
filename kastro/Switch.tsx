import dom from "./dom";
import { modify } from "../util/arrays";

class Switch {
  private selectedPane: number;
  private initializers: ((() => void) | null)[];
  private root: HTMLDivElement;

  constructor({ id, initialPane = 0, children }: {
    id: string;
    initialPane: number;
    children: ((() => void) | null)[];
  }) {
    this.selectedPane = initialPane;
    this.initializers = children;
    const Root = dom.div(id);
    this.root = Root;
    return (
      <Root modifiesChildren>
        {modify(children, (c, i) => c.nodisplay = i != initialPane)}
      </Root>
    );
  }

  /**
   * Shows the child at the given index and hides the currently shown child.
   * If the child is being shown for the first time, initializes it.
   */
  showPane(idx: number) {
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

export default Switch;
