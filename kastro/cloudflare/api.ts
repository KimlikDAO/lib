interface Auth {
  accountId: string;
  token: string;
}

interface ApiResponse {}

const ApiV4 = "https://api.cloudflare.com/client/v4";

export { Auth, ApiV4, ApiResponse };
