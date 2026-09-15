# Provider integration boundary

Concrete Firebase authentication belongs in an infrastructure adapter and is not imported by route screens.

Current production wiring:

```text
Firebase Auth SDK
      -> TokenPort
      -> GET /v1/identity/session/
      -> NexoraIdentity
      -> AuthProvider
      -> Dignity screens
```

The backend verifies Firebase ID tokens with the Firebase Admin integration, reconciles the provider subject to the internal NEXORA user UUID, and returns only the application identity needed by the client.

The mobile client treats ID tokens as opaque credentials. It does not persist provider subjects as application identities, and it never receives or uses Firebase Admin/service-account credentials.

Google sign-in is intentionally the next provider-specific step. The current adapter establishes Firebase session restoration, token handling, bearer injection, sign-out, and Nexora identity resolution without coupling route screens to a provider SDK.
