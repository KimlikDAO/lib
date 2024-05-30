build/cloudflare/test/pageWorker.compiled-test.js: cloudflare/test/pageWorker.compiled-test.js \
    cloudflare/pageWorker.d.js cloudflare/pageWorker.js \
    cloudflare/types.d.js cloudflare/moduleWorker.d.js \
    testing/assert.js testing/nodejs.d.js
	bun birimler/js/compiler.js $^ $@ --test
