const KdtsExportName = "__kdts_export__";

const KdtsExportExtern = `/** @fileoverview @externs */
function ${KdtsExportName}(name, value) {}
`;

const isIdentifierName = (name: string): boolean =>
  /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);

const toMarkerBinding = (
  prefix: string,
  name: string,
  used = new Set<string>(),
  content = ""
): string => {
  let binding = `${prefix}${name}`.replaceAll(/[^A-Za-z0-9_$]/g, "_");
  if (binding[0] >= "0" && binding[0] <= "9")
    binding = "_" + binding;
  while (used.has(binding) || (content && content.includes(binding)))
    binding += "_";
  used.add(binding);
  return binding;
}

export {
  isIdentifierName,
  KdtsExportExtern,
  KdtsExportName,
  toMarkerBinding
};
