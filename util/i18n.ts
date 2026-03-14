/**
 * BCP-style language tags we ship. Adding a member means every {@link I18nString}
 * must include that key—compile time + kdjs keep translations complete.
 */
enum LangCode {
  EN = "en",
  TR = "tr",
}

const Langs: readonly LangCode[] = [LangCode.EN, LangCode.TR];

/**
 * Represents one user-visible string in every supported language.
 *
 * When resolved with a compile time constant {@link LangCode}, kdjs will turn a
 * I18nString into a string literal.
 * @example
 * ```ts
 * const Label = { [LangCode.EN]: "A", [LangCode.TR]: "B" };
 * console.log(dom.i18n(Label));
 * ```
 * compiles to
 * ```js
 * console.log("A");
 * ```
 */
type I18nString = Record<LangCode, string>;

/**
 * Represents the same conceptual copy as {@link I18nString}, but each language
 * holds a list of string pieces (e.g. grammatical variants, join fragments).
 */
type I18nStrings = Record<LangCode, readonly string[]>;

/**
 * Represents text that is either shared across languages (plain string) or
 * per language.
 *
 * More conventient than {@link I18nString} but is harder for kdjs to inline.
 * In client code, prefer {@link I18nString}.
 */
type Localizable = Record<LangCode, string> | string;

/**
 * Picks the string for one language: object → that lang’s value; string → unchanged.
 * @pure
 */
const localize = (l: Localizable, lang: LangCode): string =>
  typeof l == "string" ? l : l[lang];

/**
 * Builds an {@link I18nString} from static template pieces and {@link Localizable} holes.
 * @pure
 */
const i18n = (
  strings: readonly string[],
  ...values: readonly Localizable[]
): I18nString => {
  const result: Partial<I18nString> = {};
  for (const lang of Langs)
    result[lang] = strings.reduce(
      (acc: string, str: string, i: number): string => {
        const value: Localizable = values[i] || "";
        return acc + str + localize(value, lang);
      },
      ""
    );
  return result as I18nString;
};

export {
  i18n,
  I18nString,
  I18nStrings,
  LangCode,
  Localizable,
  localize
};
