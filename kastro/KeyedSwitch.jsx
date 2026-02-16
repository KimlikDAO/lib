import dom from "../util/dom";

/**
 * @constructor
 * @param {{
 *   id: string,
 *   initialPane: (string | undefined),
 *   children: !Array<?function():void>,
 *   keyToIndex: !Object<string, number>,
 * }} props
 */
const KeyedSwitch = function ({ id, initialPane, children, keyToIndex }) {
  /** @type {number} */
  this.selectedPane = dom.GEN ? 0 : initialPane ? keyToIndex[initialPane] : 0;
  /** @const {Array<?function():void>} */
  this.initializers = children;
  /** @const {Object<string, number>} */
  this.keyToIndex = keyToIndex;
  /** @const {HTMLDivElement} */
  const Root = dom.div(id);
  /** @const {HTMLDivElement} */
  this.root = Root;

  return (
    <Root modifiesChildren>
      {children.modify((c, i) => {
        c.nodisplay = initialPane ? c.key != initialPane : i != this.selectedPane;
        delete c.key;
      })}
    </Root>
  );
}

/**
 * Shows the child with the given key and hides the currently shown child.
 * If the child is being shown for the first time, initializes it.
 * 
 * @param {string} key Key of the child to show
 */
KeyedSwitch.prototype.showPane = function (key) {
  /** @const {number} */
  const idx = this.keyToIndex[key];
  /** @const {number} */
  const old = this.selectedPane;
  if (idx == old) return;
  /** @const {?function():void} */
  const f = this.initializers[idx];
  if (f) {
    f();
    this.initializers[idx] = null;
  }
  this.selectedPane = idx;
  dom.show(this.root.children[idx]);
  dom.hide(this.root.children[old]);
}

export default KeyedSwitch;
