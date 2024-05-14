build/crypto/bench/secp256k1.bench.js: crypto/bench/secp256k1.bench.js crypto/secp256k1.js \
    crypto/modular.js \
    testing/assert.js testing/nodejs.js testing/nodejs.d.js \
    util/çevir.js
	mkdir -p $(dir $@)
	bun google-closure-compiler -W VERBOSE -O ADVANCED --charset UTF-8 \
                            --jscomp_error=unusedLocalVariables \
                            --jscomp_error=strictCheckTypes \
                            --emit_use_strict \
                            --module_resolution NODE \
                            --assume_function_wrapper \
                            --dependency_mode PRUNE \
                            --entry_point $< \
                            --js $^ \
                            --js_output_file $@
	bun uglifyjs testing/nodejs.js $@ -m -c toplevel,unsafe -o $@
	wc $@

build/crypto/bench/modular.bench.js: crypto/bench/modular.bench.js \
    crypto/modular.js \
    testing/assert.js testing/nodejs.d.js
	mkdir -p $(dir $@)
	bun google-closure-compiler -W VERBOSE -O ADVANCED --charset UTF-8 \
                            --jscomp_error=unusedLocalVariables \
                            --jscomp_error=strictCheckTypes \
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

build/crypto/bench/wesolowski.bench.js: crypto/bench/wesolowski.bench.js \
    crypto/wesolowski.js crypto/primes.js crypto/modular.js \
    crypto/sha3.js \
    testing/assert.js testing/nodejs.d.js \
    util/çevir.js
	mkdir -p $(dir $@)
	bun google-closure-compiler -W VERBOSE -O ADVANCED --charset UTF-8 \
                            --jscomp_error=unusedLocalVariables \
                            --jscomp_error=strictCheckTypes \
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

build/crypto/bench/primes.bench.js: crypto/bench/primes.bench.js \
    crypto/primes.js crypto/modular.js crypto/sha3.js \
    testing/assert.js testing/nodejs.d.js \
    util/çevir.js
	mkdir -p $(dir $@)
	bun google-closure-compiler -W VERBOSE -O ADVANCED --charset UTF-8 \
                            --jscomp_error=unusedLocalVariables \
                            --jscomp_error=strictCheckTypes \
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
