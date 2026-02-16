import dom from "../util/dom";

/**
 * @constructor
 * @param {{
 *   id: string,
 *   initialPane: number,
 *   children: ((() => void) | null)[]
 * }} props
 */
const Switch = function ({ id, initialPane = 0, children }) {
  /** @type {number} */
  this.selectedPane = initialPane;
  /** @const {((() => void) | null)[]} */
  this.initializers = children;
  /** @const {HTMLDivElement} */
  const Root = dom.div(id);
  /** @const {HTMLDivElement} */
  this.root = Root;

  return (
    <Root modifiesChildren>
      {children.modify((c, i) => c.nodisplay = i != initialPane)}
    </Root>
  );
}

/**
 * Shows the child at the given index and hides the currently shown child.
 * If the child is being shown for the first time, initializes it.
 * 
 * @param {number} idx Index of the child to show
 */
Switch.prototype.showPane = function (idx) {
  /** @const {number} */
  const old = this.selectedPane;
  if (idx == old) return;
  /** @const {() => void | null} */
  const f = this.initializers[idx];
  if (f) {
    f();
    this.initializers[idx] = null;
  }
  this.selectedPane = idx;
  dom.show(this.root.children[idx]);
  dom.hide(this.root.children[old]);
}

export default Switch;
