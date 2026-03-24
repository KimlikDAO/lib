export namespace JSX {
  interface RuntimeNode {
    name: ElementType;
    props: Record<string, unknown>;
  }
  type Element = RuntimeNode;
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
export interface RuntimeNode {
  name: JSX.ElementType | { name: string, id: string };
  props: Record<string, unknown>;
}
export function jsx(type: JSX.ElementType | { name: string, id: string }, props: Record<string, unknown>, key?: string): RuntimeNode;
export function jsxs(type: JSX.ElementType | { name: string, id: string }, props: Record<string, unknown>, key?: string): RuntimeNode;
