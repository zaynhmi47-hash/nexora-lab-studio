# Provider integration boundary

Concrete Firebase authentication belongs in an infrastructure adapter and is not imported by route screens.

Current mobile session flow:

```text
Firebase Auth SDK
      -> Firebase ID-token change listener
      -> TokenPort
      -> GET /v1/identity/session/
      -> NexoraIdentity
      -> AuthProvider
      -> Dignity screens
```

The backend verifies Firebase ID tokens with the Firebase Admin integration, reconciles the provider subject to the internal NEXORA user UUID, and returns only the application identity needed by the client.

The mobile client treats ID tokens as opaque credentials. It does not persist provider subjects as application identities, and it never receives or uses Firebase Admin/service-account credentials.

The auth provider subscribes to Firebase ID-token changes, including initial session restoration, sign-in, sign-out, and token refresh. Identity resolution requests are sequenced so a slower response for an older token cannot overwrite a newer session. Backend/network failures are exposed as an explicit `error` auth state rather than silently treating the user as signed out.

Google/email sign-in remains a separate provider-specific implementation step. The current adapter establishes session observation, token handling, bearer injection, sign-out, and Nexora identity resolution without coupling route screens to a provider SDK.
