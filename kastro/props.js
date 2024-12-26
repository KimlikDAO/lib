/** @typedef {!Object<string, *>} */
const Props = {};

const removeGlobalProps = (props) => {
  for (const prop in props)
    if (prop.charCodeAt(0) < 91)
      delete props[prop];
}

export { Props, removeGlobalProps };
