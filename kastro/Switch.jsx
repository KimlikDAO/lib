import dom from "../util/dom";

/**
 * @constructor
 * @param {{
 *   id: string,
 *   initialSelected: number,
 *   children: !Array<?function():void>,
 * }} props
 */
const Switch = function ({ id, initialSelected, children }) {
  /** @type {number} */
  this.selectedChild = initialSelected;
  /** @const {!Array<?function():void>} */
  this.initializers = children;
  /** @const {!HTMLDivElement} */
  const Root = dom.div(id);
  /** @const {!HTMLDivElement} */
  this.root = Root;

  return (
    <Root modifiesChildren>
      {children.modify((c, i) => c.nodisplay = i != initialSelected)}
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
  const old = this.selectedChild;
  if (idx == old) return;
  /** @const {?function():void} */
  const f = this.initializers[idx];
  if (f) {
    f();
    this.initializers[idx] = null;
  }
  this.selectedChild = idx;
  dom.show(this.root.children[idx]);
  dom.hide(this.root.children[old]);
}

export default Switch;
