# Auth contract acceptance criteria

- Route screens consume the provider-neutral AuthProvider contract and do not import Firebase SDK modules.
- The provider adapter can be replaced without changing route screens.
- Email/password sign-in, registration, password reset and sign-out are provider actions behind AuthPort.
- The backend remains responsible for verifying provider ID tokens.
- A successful backend session returns a Nexora UUID as the internal identity.
- Firebase token changes re-resolve the Nexora session.
- Missing public Firebase configuration is surfaced as an unavailable auth state, not a module-import crash.
- No client contract accepts a service-account credential or client-selected privileged role.
