export const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN,
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
  authorizationParams: {
    redirect_uri: window.location.origin,
    scope: "openid profile email",
  },
  cacheLocation: "localstorage" as const,
  useRefreshTokens: true,
};
