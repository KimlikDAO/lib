const partitionBody = (body) => {
  let ctor = null;
  let instanceProps = [];
  let other = [];
  for (const node of body)
    if (node.type == "MethodDefinition" && node.kind == "constructor")
      ctor = node;
    else if ((node.type == "PropertyDefinition" || node.type == "TSPropertySignature")
      && !node.static)
      instanceProps.push(node);
    else
      other.push(node);
  return { ctor, instanceProps, other };
};

export { partitionBody };
