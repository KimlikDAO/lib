import { Node } from "acorn";
import {
  TSArrayType,
  TSConstructorType,
  TSFunctionType,
  TSPropertySignature,
  TSTupleType,
  TSTypeReference,
  TSUnionType
} from "../ast/types";
import {
  GccGenerator,
  IdentifierTypes
} from "./generator";

class KdjsGenerator extends GccGenerator {
  override TSAnyKeyword() { this.put("any"); }
  override TSUnknownKeyword() { this.put("unknown"); }
  override TSArrayType(n: TSArrayType) { this.rec(n.elementType); this.put("[]"); }
  override TSFunctionType(n: TSFunctionType) {
    this.put("("); this.arr(n.parameters, ", ", IdentifierTypes.Ts); this.put(") => ");
    this.rec(n.typeAnnotation);
  }
  override TSConstructorType(n: TSConstructorType) {
    this.put("new "); this.TSFunctionType(n as unknown as TSFunctionType);
  }
  override TSTupleType(n: TSTupleType) { this.rec(n.elementTypes[0]); this.put("[]"); } // TODO() throw if multiple types
  override TSUnionType(n: TSUnionType) { this.arr(n.types, " | "); }
  override TSTypeReference(n: TSTypeReference) { this.rec(n.typeName); this.rec(n.typeArguments); }
  override TSPropertySignature(n: TSPropertySignature, inInterface?: boolean) {
    if (inInterface) {
      this.jsDocType(n, 0); this.rec(n.key); this.put(";");
    } else {
      this.rec(n.key); if (n.optional) this.put("?"); this.put(": "); this.rec(n.typeAnnotation);
    }
  }
}

const generate = (node: Node, options?: { djs?: boolean }): string => {
  const g = new KdjsGenerator(options?.djs);
  g.rec(node);
  return g.out;
}

export { generate };
