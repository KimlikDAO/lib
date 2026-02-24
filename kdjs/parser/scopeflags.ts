// Each scope gets a bitset that may contain these flags
// prettier-ignore

// Up to 0b00100000000 is reserved in acorn.
const TS_SCOPE_OTHER        = 0b01000000000;
const TS_SCOPE_TS_MODULE    = 0b10000000000;

// These flags are meant to be _only_ used inside the Scope class (or subclasses).
// prettier-ignore
const BIND_KIND_VALUE = 1
const BIND_KIND_TYPE = 2
// Used in checkLVal and declareName to determine the type of a binding
const BIND_SCOPE_VAR = 4; // Var-style binding
const BIND_SCOPE_LEXICAL = 8; // Let- or const-style binding
const BIND_SCOPE_FUNCTION = 16; // Function declaration
const BIND_SCOPE_OUTSIDE = 32; // Special case for function names as
// bound inside the function
// Misc flags
const BIND_FLAGS_NONE = 64;
const BIND_FLAGS_CLASS = 128;
const BIND_FLAGS_TS_ENUM = 256;
const BIND_FLAGS_TS_CONST_ENUM = 512;
const BIND_FLAGS_TS_EXPORT_ONLY = 1024;
const BIND_FLAGS_FLOW_DECLARE_FN = 2048;

// These flags are meant to be _only_ used by Scope consumers
// prettier-ignore
/*                       =    is value?    |    is type?    |      scope          |    misc flags    */
const BIND_CLASS         = BIND_KIND_VALUE | BIND_KIND_TYPE | BIND_SCOPE_LEXICAL  | BIND_FLAGS_CLASS  ;
const BIND_LEXICAL       = BIND_KIND_VALUE | 0              | BIND_SCOPE_LEXICAL  | 0                 ;
const BIND_VAR           = BIND_KIND_VALUE | 0              | BIND_SCOPE_VAR      | 0                 ;
const BIND_FUNCTION      = BIND_KIND_VALUE | 0              | BIND_SCOPE_FUNCTION | 0                 ;
const BIND_TS_INTERFACE  = 0               | BIND_KIND_TYPE | 0                   | BIND_FLAGS_CLASS  ;
const BIND_TS_TYPE       = 0               | BIND_KIND_TYPE | 0                   | 0                 ;
const BIND_TS_ENUM       = BIND_KIND_VALUE | BIND_KIND_TYPE | BIND_SCOPE_LEXICAL  | BIND_FLAGS_TS_ENUM;
const BIND_TS_AMBIENT    = 0               | 0              | 0            | BIND_FLAGS_TS_EXPORT_ONLY;
// These bindings don't introduce anything in the scope. They are used for assignments and
// function expressions IDs.
const BIND_NONE          = 0               | 0              | 0                   | BIND_FLAGS_NONE   ;
const BIND_OUTSIDE       = BIND_KIND_VALUE | 0              | 0                   | BIND_FLAGS_NONE   ;
const BIND_TS_CONST_ENUM = BIND_TS_ENUM | BIND_FLAGS_TS_CONST_ENUM;
const BIND_TS_NAMESPACE  = 0               | 0              | 0            | BIND_FLAGS_TS_EXPORT_ONLY;
const BIND_FLOW_DECLARE_FN = BIND_FLAGS_FLOW_DECLARE_FN;

type BindingTypes =
	| typeof BIND_NONE
	| typeof BIND_OUTSIDE
	| typeof BIND_VAR
	| typeof BIND_LEXICAL
	| typeof BIND_CLASS
	| typeof BIND_FUNCTION
	| typeof BIND_TS_INTERFACE
	| typeof BIND_TS_TYPE
	| typeof BIND_TS_ENUM
	| typeof BIND_TS_AMBIENT
	| typeof BIND_TS_NAMESPACE;

// prettier-ignore
const CLASS_ELEMENT_FLAG_STATIC = 0b1_00,
  CLASS_ELEMENT_KIND_GETTER = 0b0_10,
  CLASS_ELEMENT_KIND_SETTER = 0b0_01,
  CLASS_ELEMENT_KIND_ACCESSOR = CLASS_ELEMENT_KIND_GETTER | CLASS_ELEMENT_KIND_SETTER;

// prettier-ignore
const CLASS_ELEMENT_STATIC_GETTER   = CLASS_ELEMENT_KIND_GETTER | CLASS_ELEMENT_FLAG_STATIC,
  CLASS_ELEMENT_STATIC_SETTER   = CLASS_ELEMENT_KIND_SETTER | CLASS_ELEMENT_FLAG_STATIC,
  CLASS_ELEMENT_INSTANCE_GETTER = CLASS_ELEMENT_KIND_GETTER,
  CLASS_ELEMENT_INSTANCE_SETTER = CLASS_ELEMENT_KIND_SETTER,
  CLASS_ELEMENT_OTHER           = 0;

type ClassElementTypes =
	| typeof CLASS_ELEMENT_STATIC_GETTER
	| typeof CLASS_ELEMENT_STATIC_SETTER
	| typeof CLASS_ELEMENT_INSTANCE_GETTER
	| typeof CLASS_ELEMENT_INSTANCE_SETTER
	| typeof CLASS_ELEMENT_OTHER;

const SCOPE_ARROW = 16;

export {
	TS_SCOPE_OTHER,
	TS_SCOPE_TS_MODULE,
	BIND_KIND_VALUE,
	BIND_KIND_TYPE,
	BIND_SCOPE_VAR,
	BIND_SCOPE_LEXICAL,
	BIND_SCOPE_FUNCTION,
	BIND_SCOPE_OUTSIDE,
	BIND_FLAGS_NONE,
	BIND_FLAGS_CLASS,
	BIND_FLAGS_TS_ENUM,
	BIND_FLAGS_TS_CONST_ENUM,
	BIND_FLAGS_TS_EXPORT_ONLY,
	BIND_FLAGS_FLOW_DECLARE_FN,
	BIND_CLASS,
	BIND_LEXICAL,
	BIND_VAR,
	BIND_FUNCTION,
	BIND_TS_INTERFACE,
	BIND_TS_TYPE,
	BIND_TS_ENUM,
	BIND_TS_AMBIENT,
	BIND_NONE,
	BIND_OUTSIDE,
	BIND_TS_CONST_ENUM,
	BIND_TS_NAMESPACE,
	BIND_FLOW_DECLARE_FN,
	CLASS_ELEMENT_FLAG_STATIC,
	CLASS_ELEMENT_KIND_GETTER,
	CLASS_ELEMENT_KIND_SETTER,
	CLASS_ELEMENT_KIND_ACCESSOR,
	CLASS_ELEMENT_STATIC_GETTER,
	CLASS_ELEMENT_STATIC_SETTER,
	CLASS_ELEMENT_INSTANCE_GETTER,
	CLASS_ELEMENT_INSTANCE_SETTER,
	CLASS_ELEMENT_OTHER,
	SCOPE_ARROW
};
export type { BindingTypes, ClassElementTypes };
