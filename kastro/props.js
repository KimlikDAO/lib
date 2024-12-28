/** @typedef {!Object<string, *>} */
const Props = {};

const removeGlobalProps = (props) => {
  for (const prop in props)
    if (prop.charCodeAt(0) < 91)
      delete props[prop];
}

const filterGlobalProps = (props) => {
  const result = {};
  for (const prop in props)
    if (prop.charCodeAt(0) < 91)
      result[prop] = props[prop];
  return result;
}

export { Props, removeGlobalProps, filterGlobalProps };
