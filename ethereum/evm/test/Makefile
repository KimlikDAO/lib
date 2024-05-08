build/ethereum/evm/test/types.compiled-test.js: ethereum/evm/test/types.compiled-test.js \
    ethereum/evm/opcodes.js ethereum/evm/types.js \
    util/çevir.js \
    testing/assert.js testing/nodejs.d.js
	mkdir -p $(dir $@)
	bun google-closure-compiler -W VERBOSE -O ADVANCED --charset UTF-8 \
                            --jscomp_error=strictCheckTypes \
                            --jscomp_error=missingProperties \
                            --jscomp_error=unusedLocalVariables \
                            --module_resolution NODE \
                            --assume_function_wrapper \
                            --dependency_mode PRUNE \
                            --entry_point $< \
                            --js $^ \
                            --js_output_file $@
	bun uglifyjs $@ -m -c toplevel,unsafe -o $@
	wc $@

build/ethereum/evm/test/proxies.compiled-test.js: ethereum/evm/test/proxies.compiled-test.js \
    ethereum/evm/proxies.js ethereum/evm/opcodes.js \
    ethereum/evm/types.js \
    util/çevir.js \
    testing/assert.js testing/nodejs.d.js
	mkdir -p $(dir $@)
	bun google-closure-compiler -W VERBOSE -O ADVANCED --charset UTF-8 \
                            --jscomp_error=strictCheckTypes \
                            --jscomp_error=missingProperties \
                            --jscomp_error=unusedLocalVariables \
                            --module_resolution NODE \
                            --assume_function_wrapper \
                            --dependency_mode PRUNE \
                            --entry_point $< \
                            --js $^ \
                            --js_output_file $@
	bun uglifyjs $@ -m -c toplevel,unsafe -o $@
	wc $@
