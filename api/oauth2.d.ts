/**
 * @fileoverview OAuth 2.0 type definitions.
 *
 * @author KimlikDAO
 */

interface AccessToken {
  readonly access_token: string;
  readonly token_type: string;
  readonly expires_in: number;
  readonly scope: string;
}

interface AccessTokenRequest {
  readonly grant_type: string;
  readonly code: string;
  readonly client_id: string;
  readonly client_secret: string;
  readonly redirect_uri?: string;
}

export default { AccessToken, AccessTokenRequest };
