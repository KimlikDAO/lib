build/cloudflare/test/pageWorker.compiled-test.js: cloudflare/test/pageWorker.compiled-test.js \
    cloudflare/pageWorker.d.js cloudflare/pageWorker.js \
    cloudflare/types.d.js cloudflare/moduleWorker.d.js \
    testing/assert.js testing/nodejs.d.js
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
	bun uglifyjs $@ -m -c toplevel,unsafe -o $@
	bun birimler/bigintCompressor.js $@
	wc $@
