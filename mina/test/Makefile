build/mina/test/merkleTree.compiled-test.js: mina/test/merkleTree.compiled-test.js \
    mina/mina.d.js mina/merkleTree.js \
    crypto/poseidon.js crypto/modular.js \
    testing/assert.js testing/nodejs.d.js \
    util/merkleTree.js util/hex.js
	bun birimler/js/compiler.js $^ -o $@

build/mina/test/mina.compiled-test.js: mina/test/mina.compiled-test.js \
    mina/mina.d.js mina/mina.js \
    crypto/poseidon.js crypto/modular.js \
    testing/assert.js testing/nodejs.d.js \
    util/base58.js util/çevir.js
	bun birimler/js/compiler.js $^ -o $@
