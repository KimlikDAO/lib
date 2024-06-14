build/ethereum/evm/test/types.compiled-test.js: ethereum/evm/test/types.compiled-test.js \
    ethereum/evm/opcodes.js ethereum/evm/types.js \
    util/çevir.js \
    testing/assert.js testing/nodejs.d.js
	bun kdc/kdc.js $^ -o $@

build/ethereum/evm/test/proxies.compiled-test.js: ethereum/evm/test/proxies.compiled-test.js \
    ethereum/evm/proxies.js ethereum/evm/opcodes.js \
    ethereum/evm/types.js \
    util/çevir.js \
    testing/assert.js testing/nodejs.d.js
	mkdir -p $(dir $@)
	bun kdc/kdc.js $^ -o $@

