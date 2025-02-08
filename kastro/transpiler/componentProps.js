/** @type {!Object<string, *>} */
let ComponentProps = {};

const storeComponentProps = (name, { id, instance, children, render, ...props }) => {
  // For now we only store props for singleton components.
  if (id || instance) return;
  ComponentProps[name] = props;
}

const getComponentProps = () => ComponentProps;

const initComponentProps = (name, props) =>
  ComponentProps = { [name]: props };


export {
  getComponentProps,
  initComponentProps,
  storeComponentProps
};
