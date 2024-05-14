include api/test/Makefile
include cloudflare/test/Makefile
include crosschain/test/Makefile
include crypto/bench/Makefile
include crypto/test/Makefile
include did/test/Makefile
include ethereum/test/Makefile
include ethereum/evm/test/Makefile
include mina/test/Makefile
include node/test/Makefile
include util/test/Makefile

.PHONY: test test.bun test.node

BIRIMLER := api cloudflare crosschain crypto did ethereum mina node util ethereum/evm

test: test.bun test.node
bench: bench.bun bench.node

test.bun: $(addsuffix .test.bun, $(BIRIMLER))
bench.bun: crypto.bench.bun

test.node: $(addsuffix .test.node, $(BIRIMLER))
bench.node: crypto.bench.node

$(addsuffix .test,$(BIRIMLER)): %.test: %.test.bun %.test.node
$(addsuffix .bench,$(BIRIMLER)): %.bench: %.bench.bun %.bench.node

build/%.compiled-test.bun: build/%.compiled-test.js
	bun $^

build/%.compiled-test.node: build/%.compiled-test.js
	node $^

build/%.bench.bun: build/%.bench.js
	bun $^

build/%.bench.node: build/%.bench.js
	node $^

clean:
	rm -rf build

$(foreach dir,$(BIRIMLER),$(eval $(dir).test.bun: \
    $(patsubst %,build/%.bun,$(basename $(wildcard $(dir)/test/*.compiled-test.js) \
    $(wildcard $(dir)/test/*/*.compiled-test.js)))))
$(foreach dir,$(BIRIMLER),$(eval $(dir).test.node: \
    $(patsubst %,build/%.node,$(basename $(wildcard $(dir)/test/*.compiled-test.js) \
    $(wildcard $(dir)/test/*/*.compiled-test.js)))))

$(foreach dir,$(BIRIMLER),$(eval $(dir).bench.bun: \
    $(patsubst %,build/%.bun,$(basename $(wildcard $(dir)/bench/*.bench.js) \
    $(wildcard $(dir)/bench/*/*.bench.js)))))
$(foreach dir,$(BIRIMLER),$(eval $(dir).bench.node: \
    $(patsubst %,build/%.node,$(basename $(wildcard $(dir)/bench/*.bench.js) \
    $(wildcard $(dir)/bench/*/*.bench.js)))))
