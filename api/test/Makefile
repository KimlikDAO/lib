build/api/test/jsonrpc.compiled-test.js: api/test/jsonrpc.compiled-test.js \
    api/jsonrpc.d.js api/jsonrpc.js \
    crypto/sha3.js crypto/secp256k1.js crypto/modular.js \
    ethereum/evm.js \
    testing/assert.js testing/nodejs.d.js \
    util/çevir.js
	mkdir -p $(dir $@)
	bun google-closure-compiler -W VERBOSE -O ADVANCED --charset UTF-8 \
                            --jscomp_error=strictCheckTypes \
                            --jscomp_error=unusedLocalVariables \
                            --module_resolution NODE \
                            --assume_function_wrapper \
                            --dependency_mode PRUNE \
                            --entry_point $< \
                            --js $^ \
                            --js_output_file $@
	bun uglifyjs $@ -m -o $@
	bun birimler/bigintCompressor.js $@
	wc $@
