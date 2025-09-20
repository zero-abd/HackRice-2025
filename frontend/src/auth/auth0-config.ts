export const auth0Config = {
  domain: "dev-vsok4njdueqa22q1.us.auth0.com",
  clientId: "mNYLi9yXfBgvaUwYBAeKa2Frsp6FsEHE",
  authorizationParams: {
    redirect_uri: window.location.origin,
    scope: "openid profile email",
  },
  cacheLocation: "localstorage" as const,
  useRefreshTokens: true,
};
