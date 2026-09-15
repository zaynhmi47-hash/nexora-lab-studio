# Dignity Auth & Identity Boundary

This module defines the client-side authentication contract without coupling screens to Firebase or another identity provider.

## Rules

- `NexoraIdentity.id` is the internal Nexora UUID.
- Provider subjects (for example a Firebase UID) must never become the internal primary identity.
- Provider SDKs belong in infrastructure adapters behind `AuthPort`.
- Screens consume `useAuth()` and do not initialize provider SDKs.
- Secrets and service-account credentials must never be placed in Expo client configuration.

## Next implementation

The next adapter will connect the port to the existing Nexora Core identity flow and provider token verification. Sign-in UI should only be added after the adapter contract and session lifecycle are validated.
