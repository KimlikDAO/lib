/**
 * @fileoverview Etherem transaction definitions.
 *
 * @author KimlikDAO
 */

import eth from "./eth.d";

/**
 * Represents an ethereum transaction, to be sent to a provider.
 *
 * @interface
 * @struct
 */
eth.Transaction = function () { }

/** @type {string} */
eth.Transaction.prototype.to;

/** @type {string} */
eth.Transaction.prototype.from;

/** @type {string} */
eth.Transaction.prototype.value;

/** @type {string} */
eth.Transaction.prototype.data;

/** @type {string} */
eth.Transaction.prototype.chainId;

/** @type {string} */
eth.Transaction.prototype.gas;
