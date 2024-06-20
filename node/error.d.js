/**
 * @fileoverview API veri şekli tanımları.
 *
 * @author KimlikDAO
 * @externs
 */

import node from "./node.d";

/**
 * @struct
 * @constructor
 *
 * @param {number} kod
 * @param {!Array<string>=} ek
 */
node.HataBildirimi = function (kod, ek) {
  /** @const {number} */
  this.kod = kod;
  /** @const {!Array<string>|undefined} */
  this.ek = ek;
}

/** @type {number} */
node.HataBildirimi.prototype.kod;

/** @type {!Array<string>|undefined} */
node.HataBildirimi.prototype.ek;
