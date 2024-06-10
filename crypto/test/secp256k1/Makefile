build/crypto/test/secp256k1/unit.compiled-test.js: crypto/test/secp256k1/unit.compiled-test.js \
    crypto/secp256k1.js crypto/modular.js \
    testing/assert.js testing/nodejs.js testing/nodejs.d.js \
    util/çevir.js
	bun birimler/js/compiler.js $^ -o $@


build/crypto/test/secp256k1/nobleVectors.compiled-test.js: \
    crypto/test/secp256k1/nobleVectors.compiled-test.js \
    crypto/secp256k1.js crypto/modular.js \
    crypto/sha3.js \
    testing/assert.js testing/fsPromises.d.js \
    testing/nodejs.d.js \
    util/çevir.js
	mkdir -p $(dir $@)
	bun google-closure-compiler -W VERBOSE -O ADVANCED --charset UTF-8 \
                            --jscomp_error=strictCheckTypes \
                            --jscomp_error=unusedLocalVariables \
                            --emit_use_strict \
                            --module_resolution NODE \
                            --assume_function_wrapper \
                            --dependency_mode PRUNE \
                            --entry_point $< \
                            --js $^ \
                            --js_output_file $@
	bun uglifyjs testing/fsPromises.js $@ -m -c toplevel,unsafe -o $@
	wc $@
