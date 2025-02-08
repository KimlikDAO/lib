/**
 * @const
 */
const oauth2 = {};

/**
 * @typedef {{
 *   access_token: string,
 *   token_type: string,
 *   expires_in: number,
 *   scope: string
 * }}
 */
oauth2.AccessToken;

/**
 * @typedef {{
 *   grant_type: string,
 *   code: string,
 *   client_id: string,
 *   client_secret: string,
 *   redirect_uri: (string | undefined)
 * }}
 */
oauth2.AccessTokenRequest;

export default oauth2;
