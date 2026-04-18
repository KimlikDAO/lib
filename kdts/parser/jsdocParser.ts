import { Modifier } from "../model/modifier";

const isWhitespace = (charCode: number): boolean => charCode <= 32;

const modifierFromIdentifier = (ident: string): number => {
  if (!ident.endsWith("Fn"))
    return 0;
  const modifier = Modifier[ident.slice(0, -2) as keyof typeof Modifier];
  return typeof modifier == "number" ? modifier : 0;
}

const modifiersFromExpression = (clause: string): number => {
  let modifiers = 0;
  const parts = clause.split("&");
  for (let i = 0; i < parts.length; ++i)
    modifiers |= modifierFromIdentifier(parts[i]!.trim());
  return modifiers;
}

const modifiersFromJsDoc = (jsDoc: string): number => {
  let modifiers = 0;
  const parts = jsDoc.split("@satisfies");

  for (let i = 1; i < parts.length; ++i) {
    const part = parts[i]!;
    let cursor = 0;
    while (cursor < part.length && isWhitespace(part.charCodeAt(cursor)))
      ++cursor;
    if (part.charCodeAt(cursor) != 123)
      continue;
    const bracedEnd = part.indexOf("}", cursor + 1);
    if (bracedEnd == -1)
      continue;
    modifiers |= modifiersFromExpression(part.slice(cursor + 1, bracedEnd));
  }
  return modifiers;
}

export { modifiersFromJsDoc };
