# Provider integration boundary

Concrete Firebase authentication belongs in an infrastructure adapter and is not imported by route screens.

Expected production wiring:

```text
Firebase Auth SDK
      -> TokenPort
      -> Nexora Core identity endpoint
      -> NexoraIdentity
      -> AuthProvider
      -> Dignity screens
```

The backend verifies Firebase ID tokens. The mobile client should treat tokens as opaque credentials and only use the Nexora identity returned by the backend for application state.
