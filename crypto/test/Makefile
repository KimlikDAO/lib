include crypto/test/poseidon/Makefile
include crypto/test/secp256k1/Makefile

build/crypto/test/integration.compiled-test.js: crypto/test/integration.compiled-test.js \
    crypto/secp256k1.js crypto/sha3.js crypto/modular.js \
    ethereum/evm.js \
    testing/assert.js testing/nodejs.js testing/nodejs.d.js \
    testing/vm.js \
    util/çevir.js
	bun birimler/js/compiler.js $^ $@ --test

build/crypto/test/modular.compiled-test.js: crypto/test/modular.compiled-test.js \
    crypto/modular.js \
    testing/assert.js testing/nodejs.d.js \
    util/çevir.js
	bun birimler/js/compiler.js $^ $@ --test

build/crypto/test/sha3.compiled-test.js: crypto/test/sha3.compiled-test.js crypto/test/sha3_*.js \
    crypto/sha3.js \
    testing/assert.js testing/nodejs.d.js \
    util/çevir.js
	bun birimler/js/compiler.js $^ $@ --test

build/crypto/test/wesolowski.compiled-test.js: crypto/test/wesolowski.compiled-test.js \
    crypto/wesolowski.js crypto/primes.js crypto/modular.js \
    crypto/sha3.js \
    testing/assert.js testing/nodejs.d.js \
    util/çevir.js
	bun birimler/js/compiler.js $^ $@ --test

build/crypto/test/primes.compiled-test.js: crypto/test/primes.compiled-test.js \
    crypto/primes.js crypto/modular.js \
    testing/assert.js testing/nodejs.d.js
	bun birimler/js/compiler.js $^ $@ --test
