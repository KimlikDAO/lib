import "./api.d";

/**
 * @struct
 * @typedef {{
 *   accountId: string,
 *   zoneId: string,
 *   token: string
 * }}
 */
const Auth = {};

/** @const {string} */
const ApiV4 = "https://api.cloudflare.com/client/v4";

export { Auth, ApiV4 };
