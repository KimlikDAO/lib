build/crypto/bench/secp256k1.bench.js: crypto/bench/secp256k1.bench.js crypto/secp256k1.js \
    crypto/modular.js \
    testing/assert.js testing/nodejs.d.js \
    util/çevir.js
	bun kdc/kdc.js $^ -o $@

build/crypto/bench/modular.bench.js: crypto/bench/modular.bench.js \
    crypto/modular.js \
    testing/assert.js testing/nodejs.d.js
	bun kdc/kdc.js $^ -o $@

build/crypto/bench/wesolowski.bench.js: crypto/bench/wesolowski.bench.js \
    crypto/wesolowski.js crypto/primes.js crypto/modular.js \
    crypto/sha3.js \
    testing/assert.js testing/nodejs.d.js \
    util/çevir.js
	bun kdc/kdc.js $^ -o $@

build/crypto/bench/primes.bench.js: crypto/bench/primes.bench.js \
    crypto/primes.js crypto/modular.js crypto/sha3.js \
    testing/assert.js testing/nodejs.d.js \
    util/çevir.js
	bun kdc/kdc.js $^ -o $@
