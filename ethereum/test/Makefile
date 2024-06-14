build/ethereum/test/evm.compiled-test.js: ethereum/test/evm.compiled-test.js \
    crypto/secp256k1.js crypto/sha3.js crypto/modular.js \
    ethereum/evm.js \
    testing/assert.js testing/nodejs.d.js \
    util/çevir.js
	bun kdc/kdc.js $^ -o $@

build/ethereum/test/eravm.compiled-test.js: ethereum/test/eravm.compiled-test.js \
    crypto/sha3.js \
    ethereum/eravm.js \
    testing/assert.js testing/nodejs.d.js \
    util/çevir.js
	bun kdc/kdc.js $^ -o $@

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
	bun kdc/kdc.js $^ -o $@
