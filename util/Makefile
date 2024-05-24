define gccModule
-W VERBOSE -O ADVANCED --charset UTF-8 \
--emit_use_strict \
--language_in ECMASCRIPT_NEXT \
--module_resolution NODE \
--assume_function_wrapper \
--dependency_mode PRUNE \
--language_in ECMASCRIPT_NEXT \
--entry_point $(word 1, $(1)) \
--js $(1) \
--js_output_file $(2)
endef

define gccModuleSimple
-W VERBOSE -O SIMPLE \
--language_in ECMASCRIPT_NEXT \
--module_resolution NODE \
--assume_function_wrapper \
--dependency_mode PRUNE \
--entry_point $(word 1, $(1)) \
--js $(1) \
--js_output_file $(2)
endef
