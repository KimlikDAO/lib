build/ethereum/test/evm.compiled-test.js: ethereum/test/evm.compiled-test.js \
    crypto/secp256k1.js crypto/sha3.js crypto/modular.js \
    ethereum/evm.js \
    testing/assert.js testing/nodejs.d.js \
    util/çevir.js
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
	bun birimler/bigintCompressor.js $@
	wc $@

build/ethereum/test/eravm.compiled-test.js: ethereum/test/eravm.compiled-test.js \
    crypto/sha3.js \
    ethereum/eravm.js \
    testing/assert.js testing/nodejs.d.js \
    util/çevir.js
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
	bun birimler/bigintCompressor.js $@
	wc $@

build/ethereum/test/KPass.compiled-test.js: ethereum/test/KPass.compiled-test.js \
    api/jsonrpc.d.js api/jsonrpc.js \
    crosschain/chains.js \
    crypto/secp256k1.js crypto/sha3.js crypto/modular.js \
    ethereum/eth.d.js ethereum/logs.d.js ethereum/transaction.d.js \
    ethereum/provider.d.js ethereum/provider.js \
    ethereum/KPassLite.js ethereum/KPass.js \
    ethereum/evm.js \
    testing/assert.js testing/nodejs.d.js \
    util/çevir.js
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
	bun uglifyjs testing/provider.js $@ -m -c toplevel,unsafe -o $@
	bun birimler/bigintCompressor.js $@
	wc $@
