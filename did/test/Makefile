build/did/test/decryptedSections.compiled-test.js: did/test/decryptedSections.compiled-test.js \
    did/*.d.js did/section.js did/decryptedSections.js \
    did/verifiableID.js \
    crosschain/unlockable.d.js crosschain/signer.js crosschain/unlockable.js \
    crypto/sha3.js crypto/modular.js crypto/secp256k1.js \
    crypto/primes.js crypto/wesolowski.js \
    ethereum/*.d.js ethereum/evm.js \
    node/nvi.d.js \
    testing/assert.js testing/nodejs.js testing/nodejs.d.js \
    testing/vm.js testing/crosschain.js \
    util/çevir.js
	bun birimler/js/compiler.js $^ -o $@


build/did/test/section.compiled-test.js: did/test/section.compiled-test.js \
    did/*.d.js did/section.js \
    crosschain/unlockable.d.js crosschain/unlockable.js \
    crypto/sha3.js crypto/modular.js crypto/secp256k1.js \
    ethereum/eth.d.js ethereum/encryptedData.d.js ethereum/evm.js \
    node/nvi.d.js \
    testing/assert.js testing/nodejs.js testing/nodejs.d.js \
    testing/vm.js \
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
	bun uglifyjs testing/nodejs.js $@ -m -c toplevel,unsafe -o $@
	wc $@

build/did/test/verifiableID.compiled-test.js: did/test/verifiableID.compiled-test.js \
    crosschain/unlockable.d.js crosschain/unlockable.js \
    crypto/wesolowski.js crypto/primes.js crypto/modular.js \
    crypto/sha3.js \
    did/*.d.js did/verifiableID.js \
    ethereum/eth.d.js ethereum/encryptedData.d.js ethereum/evm.js \
    node/nvi.d.js \
    testing/assert.js testing/nodejs.d.js testing/nodejs.js \
    util/çevir.js
	mkdir -p $(dir $@)
	bun google-closure-compiler -W VERBOSE -O ADVANCED --charset UTF-8 \
                            --jscomp_error=strictCheckTypes \
                            --jscomp_error=checkTypes \
                            --jscomp_error=unusedLocalVariables \
                            --module_resolution NODE \
                            --assume_function_wrapper \
                            --dependency_mode PRUNE \
                            --entry_point $< \
                            --js $^ \
                            --js_output_file $@
	bun uglifyjs testing/nodejs.js $@ -m -c toplevel,unsafe -o $@
	wc $@
