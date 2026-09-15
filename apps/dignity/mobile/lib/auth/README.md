# Dignity Auth & Identity Boundary

The mobile app uses provider-neutral contracts so authentication providers can change without changing feature screens.

## Flow

1. A provider adapter owns provider SDK state and exposes a `TokenPort`.
2. The `NexoraIdentityPort` resolves the authenticated session through Nexora Core.
3. The resulting `NexoraIdentity.id` is the internal Nexora UUID.
4. Screens consume `useAuth()` and never initialize Firebase or another provider SDK directly.

## Security rules

- Provider subjects are external identifiers, not Nexora primary keys.
- ID tokens are credentials and must not be logged by feature code.
- Service-account credentials and Firebase Admin credentials are server-only.
- Only non-secret `EXPO_PUBLIC_*` configuration may reach the Expo client.

The concrete Firebase adapter is intentionally an infrastructure concern. The mobile layer only defines the contract needed to integrate it safely with Nexora Core, where Firebase ID tokens are verified.
