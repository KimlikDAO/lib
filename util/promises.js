/**
 * @template T
 * @param {T} cevap
 * @param {number} süre
 * @return {!Promise<T>}
 */
const bekle = (cevap, süre) => new Promise(
  (/** @type {function(T):void} */ resolve) => setTimeout(() => resolve(cevap), süre));

/**
 * @param {number} enFazla
 */
const darboğaz = (enFazla) => {
  /**
   * @typedef {{
   *   sözVer: function(): !Promise,
   *   sonuç: function(*): void,
   *   hata: function(*): void
   * }}
   */
  const Görev = {};
  /** @const {!Array<Görev>} */
  const sıra = [];

  const adım = () => {
    if (sıra.length > 0 && enFazla > 0) {
      --enFazla;
      const { sözVer, sonuç, hata } = sıra.shift();
      sözVer().then(sonuç, hata).finally(() => {
        ++enFazla;
        adım();
      });
    }
  }

  /**
   * @template T
   * @param {function():!Promise<T>} sözVer
   * @return {!Promise<T>}
   */
  const ekle = (sözVer) => new Promise((sonuç, hata) => {
    sıra.push({ sözVer, sonuç, hata });
    adım();
  });

  return ekle;
};

export {
  bekle,
  darboğaz
};
