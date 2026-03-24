export const Fragment = "" as const;

export type RuntimeProps = Record<string, unknown>;

export namespace JSX {
  export interface RuntimeNode {
    name: ElementType;
    props: Record<string, unknown>;
  }

  export type Element = RuntimeNode;
  export type ElementType =
    | keyof IntrinsicElements
    | HTMLElement
    | ((props: any) => any)
    | (new (props: any) => any);

  export interface IntrinsicElements {
    [elem: string]: Record<string, unknown>;
  }
}

declare global {
  interface HTMLElement {
    (props?: Record<string, unknown>): JSX.Element;
  }
}

export type RuntimePseudoNode = {
  id: string;
  name: string;
};

export type RuntimeElementType =
  | string
  | RuntimePseudoNode
  | { render: (props: RuntimeProps) => unknown }
  | ((props: RuntimeProps) => unknown)
  | (new (props: RuntimeProps) => unknown);

export type RuntimeRenderable =
  | RuntimeNode
  | Promise<unknown>
  | string
  | number
  | boolean
  | null
  | undefined
  | unknown[];

export interface RuntimeNode {
  name: RuntimeElementType;
  props: RuntimeProps;
}

const isPseudoNode = (value: unknown): value is RuntimePseudoNode =>
  !!value &&
  typeof value == "object" &&
  "id" in value &&
  "name" in value &&
  typeof (value as RuntimePseudoNode).id == "string" &&
  typeof (value as RuntimePseudoNode).name == "string";

export const jsx = (
  name: RuntimeElementType,
  props: RuntimeProps = {},
  _key?: string
): RuntimeNode => {
  if (isPseudoNode(name))
    return {
      name: name.name,
      props: { id: name.id, ...props }
    };

  return { name, props };
};

export const jsxs = jsx;
