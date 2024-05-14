build/node/test/ipfs.compiled-test.js: node/test/ipfs.compiled-test.js \
    node/ipfs.d.js node/ipfs.js node/error.d.js \
    testing/assert.js testing/nodejs.d.js testing/nodejs.js \
    util/çevir.js
	mkdir -p $(dir $@)
	bun google-closure-compiler -W VERBOSE -O ADVANCED --charset UTF-8 \
                            --jscomp_error=unusedLocalVariables \
                            --jscomp_error=strictCheckTypes \
                            --emit_use_strict \
                            --module_resolution NODE \
                            --assume_function_wrapper \
                            --dependency_mode PRUNE \
                            --entry_point $< \
                            --js $^ \
                            --js_output_file $@
	bun uglifyjs testing/nodejs.js $@ -m -c toplevel,unsafe -o $@
	bun birimler/bigintCompressor.js $@
	wc $@

build/node/test/ipfs.compiled-test.bun:
	echo "\x1b[41mSkipping bun tests as bun support for FormData and Blob is WIP.\x1b[0m"
