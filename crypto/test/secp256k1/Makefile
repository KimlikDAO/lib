build/crypto/test/secp256k1/unit.compiled-test.js: crypto/test/secp256k1/unit.compiled-test.js \
    crypto/secp256k1.js crypto/modular.js \
    testing/assert.js testing/nodejs.d.js \
    util/çevir.js
	bun birimler/js/compiler.js $^ -o $@


build/crypto/test/secp256k1/nobleVectors.compiled-test.js: \
    crypto/test/secp256k1/nobleVectors.compiled-test.js \
    crypto/secp256k1.js crypto/modular.js \
    crypto/sha3.js \
    testing/assert.js testing/fsPromises.d.js \
    testing/nodejs.d.js \
    util/çevir.js
	mkdir -p $(dir $@)
	bun birimler/js/compiler.js $^ -o $@.tmp
	cat testing/fsPromises.js $@.tmp > $@
