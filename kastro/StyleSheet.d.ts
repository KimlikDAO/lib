interface KastroStyleSheetTarget {
  content: string;
  targetName: string;
}

type KastroDynamicStyleSheet = any;

export function addStyleSheet(
  shared: boolean,
  target: KastroStyleSheetTarget
): string;

export function css(
  strings: TemplateStringsArray,
  ...values: Array<string | number | boolean | null | undefined>
): KastroDynamicStyleSheet;

export function makeStyleSheet(
  fileName: string,
  cssContent: string
): KastroDynamicStyleSheet;

export function makeStyleSheets(): (props: {
  BuildMode: number;
  Lang: KastroLangCode;
  targetDir: string;
}) => KastroComponentResult;

declare const StyleSheet: unknown;
export default StyleSheet;
