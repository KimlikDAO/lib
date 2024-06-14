build/did/test/decryptedSections.compiled-test.js: did/test/decryptedSections.compiled-test.js \
    did/*.d.js did/section.js did/decryptedSections.js \
    did/verifiableID.js \
    crosschain/unlockable.d.js crosschain/signer.js crosschain/unlockable.js \
    crypto/sha3.js crypto/modular.js crypto/secp256k1.js \
    crypto/primes.js crypto/wesolowski.js \
    ethereum/*.d.js ethereum/evm.js \
    node/nvi.d.js \
    testing/assert.js testing/nodejs.d.js \
    testing/vm.js testing/crosschain.js \
    util/çevir.js
	bun kdc/kdc.js $^ -o $@


build/did/test/section.compiled-test.js: did/test/section.compiled-test.js \
    did/*.d.js did/section.js \
    crosschain/unlockable.d.js crosschain/unlockable.js \
    crypto/sha3.js crypto/modular.js crypto/secp256k1.js \
    ethereum/eth.d.js ethereum/encryptedData.d.js ethereum/evm.js \
    node/nvi.d.js \
    testing/assert.js testing/nodejs.d.js \
    testing/vm.js \
    util/çevir.js
	mkdir -p $(dir $@)
	bun kdc/kdc.js $^ -o $@

build/did/test/verifiableID.compiled-test.js: did/test/verifiableID.compiled-test.js \
    crosschain/unlockable.d.js crosschain/unlockable.js \
    crypto/wesolowski.js crypto/primes.js crypto/modular.js \
    crypto/sha3.js \
    did/*.d.js did/verifiableID.js \
    ethereum/eth.d.js ethereum/encryptedData.d.js ethereum/evm.js \
    node/nvi.d.js \
    testing/assert.js testing/nodejs.d.js \
    util/çevir.js
	mkdir -p $(dir $@)
	bun kdc/kdc.js $^ -o $@
