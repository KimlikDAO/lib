build/util/test/çevir.compiled-test.js: util/test/çevir.compiled-test.js \
    testing/assert.js testing/nodejs.d.js \
    util/çevir.js
	bun kdc/kdc.js $^ -o $@

build/util/test/base58.compiled-test.js: util/test/base58.compiled-test.js \
    testing/assert.js testing/nodejs.d.js \
    util/base58.js util/çevir.js
	bun kdc/kdc.js $^ -o $@
