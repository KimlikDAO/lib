build/mina/test/merkleTree.compiled-test.js: mina/test/merkleTree.compiled-test.js \
    mina/mina.d.js mina/merkleTree.d.js mina/merkleTree.js \
    crypto/poseidon.js crypto/modular.js \
    testing/assert.js testing/nodejs.d.js
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

build/mina/test/mina.compiled-test.js: mina/test/mina.compiled-test.js \
    mina/mina.d.js mina/mina.js \
    crypto/poseidon.js crypto/modular.js \
    testing/assert.js testing/nodejs.d.js \
    util/base58.js util/çevir.js
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
