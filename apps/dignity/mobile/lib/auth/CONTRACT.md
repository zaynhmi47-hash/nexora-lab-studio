# Auth contract acceptance criteria

- The UI can be tested without a Firebase SDK dependency.
- The provider adapter can be replaced without changing route screens.
- The backend remains responsible for verifying provider ID tokens.
- A successful backend session returns a Nexora UUID as the internal identity.
- Sign-out clears provider credentials through `TokenPort`.
- No client contract accepts a service-account credential.
