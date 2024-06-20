/**
 * @author KimlikDAO
 * @externs
 */

import cloudflare from "./cloudflare.d";

/**
 * @interface
 * @extends {cloudflare.Environment}
 */
cloudflare.PageWorkerEnv = function () { };

/** @type {!cloudflare.KeyValue} */
cloudflare.PageWorkerEnv.prototype.KV;
