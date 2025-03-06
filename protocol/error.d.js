/**
 * @fileoverview Error message structs.
 *
 * @author KimlikDAO
 */

import protocol from "./protocol.d";

protocol.ErrorMessage = class {
  /**
   * @param {number} code
   * @param {!Array<string>=} messages
   */
  constructor(code, messages) {
    /** @const {number} */
    this.code = code;
    /** @const {!Array<string>|undefined} */
    this.messages = messages;
  }
}
