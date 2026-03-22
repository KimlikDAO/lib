export namespace JSX {
  type Element = any;
  type ElementType =
    | keyof IntrinsicElements
    | HTMLElement
    | ((props: any) => any)
    | (new (props: any) => any);
  interface IntrinsicElements {
    [elem: string]: Record<string, unknown>;
  }
}

declare global {
  interface HTMLElement {
    (props?: Record<string, unknown>): JSX.Element;
  }
}

export const Fragment: "";
export function jsx(type: JSX.ElementType, props: Record<string, unknown>, key?: string): JSX.Element;
export function jsxs(type: JSX.ElementType, props: Record<string, unknown>, key?: string): JSX.Element;
