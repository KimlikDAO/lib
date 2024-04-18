/**
 * @author KimlikDAO
 * @externs
 */

/**
 * @interface
 * @extends {did.AddressInfo}
 * @extends {nvi.AdresBilgileri}
 */
did.TürkiyeAdresi = function () { }

/**
 * Kişinin kütük bilgilerini içerir bilgi kartı.
 *
 * @interface
 * @extends {did.Section}
 * @extends {nvi.KutukBilgileri}
 */
did.KütükBilgileri = function () { }

/**
 * @interface
 * @extends {did.Section}
 */
did.SoyZinciri = function () { }

/**
 * Sağ ebeveynler için `symmetricKey` tutuyoruz.
 *
 * @type {string}
 */
did.SoyZinciri.prototype.anneSymmetricKey;

/**
 * Sağ ebeveynler için `symmetricKey` tutuyoruz.
 *
 * @type {string}
 */
did.SoyZinciri.prototype.annePrivateKey;

/**
 * Sağ ebeveynler için `symmetricKey` tutuyoruz.
 *
 * @type {string}
 */
did.SoyZinciri.prototype.babaSymmetricKey;

/**
 * Sağ ebeveynler için `symmetricKey` tutuyoruz.
 *
 * @type {string}
 */
did.SoyZinciri.prototype.babaPrivateKey;
