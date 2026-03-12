/**
 * Returns "string" or "number" for a TS enum. Throws if the enum mixes both.
 */
const determineEnumType = (n) => {
  let hasString = false;
  let hasNumber = false;
  for (const member of n.members) {
    const init = member.initializer;
    if (!init) {
      hasNumber = true; // auto-increment
    } else if (
      init.type === "StringLiteral" ||
      (init.type === "Literal" && typeof init.value === "string")
    ) {
      hasString = true;
    } else {
      hasNumber = true; // number or other
    }
  }
  if (hasString && hasNumber) {
    const name = n.id?.name ?? "enum";
    const locEnd = n.loc?.end ? ` ${n.loc.end.line}:${n.loc.end.column}` : "";
    const err = new Error(
      `Mixed enums (string and number) are not supported. Use a string-only or number-only enum: ${name}${locEnd}`
    );
    if (n.loc) err.loc = n.loc;
    if (n.start != null) err.start = n.start;
    if (n.end != null) err.end = n.end;
    throw err;
  }
  return hasString ? "string" : "number";
};

export { determineEnumType };
