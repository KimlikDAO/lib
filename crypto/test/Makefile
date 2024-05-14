include crypto/test/poseidon/Makefile
include crypto/test/secp256k1/Makefile

build/crypto/test/integration.compiled-test.js: crypto/test/integration.compiled-test.js \
    crypto/secp256k1.js crypto/sha3.js crypto/modular.js \
    ethereum/evm.js \
    testing/assert.js testing/nodejs.js testing/nodejs.d.js \
    testing/vm.js \
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
	bun uglifyjs testing/nodejs.js $@ -m -c toplevel,unsafe -o $@
	bun birimler/bigintCompressor.js $@
	wc $@

build/crypto/test/modular.compiled-test.js: crypto/test/modular.compiled-test.js \
    crypto/modular.js \
    testing/assert.js testing/nodejs.d.js \
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
	bun uglifyjs $@ -m -c toplevel,unsafe -o $@
	bun birimler/bigintCompressor.js $@
	wc $@

build/crypto/test/sha3.compiled-test.js: crypto/test/sha3.compiled-test.js crypto/test/sha3_*.js \
    crypto/sha3.js \
    testing/assert.js testing/nodejs.d.js \
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
	bun uglifyjs $@ -m -c toplevel,unsafe -o $@
	bun birimler/bigintCompressor.js $@
	wc $@

build/crypto/test/wesolowski.compiled-test.js: crypto/test/wesolowski.compiled-test.js \
    crypto/wesolowski.js crypto/primes.js crypto/modular.js \
    crypto/sha3.js \
    testing/assert.js testing/nodejs.d.js \
    util/çevir.js
	mkdir -p $(dir $@)
	bun google-closure-compiler -W VERBOSE -O ADVANCED --charset UTF-8 \
                            --jscomp_error=checkTypes \
                            --jscomp_error=strictCheckTypes \
                            --jscomp_error=unusedLocalVariables \
                            --emit_use_strict \
                            --module_resolution NODE \
                            --assume_function_wrapper \
                            --dependency_mode PRUNE \
                            --entry_point $< \
                            --js $^ \
                            --js_output_file $@
	bun uglifyjs $@ -m -c toplevel,unsafe -o $@
	bun birimler/bigintCompressor.js $@
	wc $@

build/crypto/test/primes.compiled-test.js: crypto/test/primes.compiled-test.js \
    crypto/primes.js crypto/modular.js \
    testing/assert.js testing/nodejs.d.js
	mkdir -p $(dir $@)
	bun google-closure-compiler -W VERBOSE -O ADVANCED --charset UTF-8 \
                            --jscomp_error=checkTypes \
                            --jscomp_error=strictCheckTypes \
                            --jscomp_error=unusedLocalVariables \
                            --emit_use_strict \
                            --module_resolution NODE \
                            --assume_function_wrapper \
                            --dependency_mode PRUNE \
                            --entry_point $< \
                            --js $^ \
                            --js_output_file $@
	bun uglifyjs $@ -m -c toplevel,unsafe -o $@
	bun birimler/bigintCompressor.js $@
	wc $@
