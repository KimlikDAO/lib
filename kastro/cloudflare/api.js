import "./api.d";

/**
 * The keys here are deliberately different from `cloudflare.Auth`
 * to prevent kdjs from defensively treating Auth like an extern.
 *
 * @struct
 * @typedef {{
 *   account: string,
 *   apiToken: string
 * }}
 */
const Auth = {};

/** @const {string} */
const ApiV4 = "https://api.cloudflare.com/client/v4";

export { Auth, ApiV4 };
