import cloudflare from "./cloudflare.d";

/**
 * @typedef {{
 *   accountId: string,
 *   zoneId: string,
 *   token: string
 * }}
 */
cloudflare.Auth;

/**
 * @typedef {{
 *   success: boolean
 * }}
 */
cloudflare.Response;
