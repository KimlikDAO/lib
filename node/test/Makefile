build/node/test/ipfs.compiled-test.js: node/test/ipfs.compiled-test.js \
    node/ipfs.d.js node/ipfs.js node/error.d.js \
    testing/assert.js testing/nodejs.d.js \
    util/base58.js util/çevir.js
	bun kdc/kdc.js $^ -o $@

build/node/test/ipfs.compiled-test.bun:
	echo "\x1b[41mSkipping bun tests as bun support for FormData and Blob is WIP.\x1b[0m"
