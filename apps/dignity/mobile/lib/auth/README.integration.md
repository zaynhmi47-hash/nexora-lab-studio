# Provider integration boundary

Current mobile authentication flow:

Firebase Auth (email/password)
  -> Firebase ID token
  -> TokenPort
  -> GET /v1/identity/session/
  -> Django FirebaseIdentityAuthentication
  -> Nexora IdentityService
  -> Nexora UUID
  -> Dignity AuthProvider / screens

## Implemented behavior

- Firebase restores persisted sessions and notifies Dignity when the ID token changes.
- Email/password sign-in and registration are handled by Firebase Auth.
- Password reset requests are sent through Firebase Auth.
- The client exchanges a Firebase ID token for the internal Nexora identity.
- The API remains responsible for token verification and identity reconciliation.
- Sign-out clears the Firebase session.
- Missing Firebase configuration is reported as an unavailable auth state instead of crashing during module import.

## Required Expo environment

Copy .env.example to .env in apps/dignity/mobile and provide the public Firebase web/app configuration values plus the Nexora API base URL. These values are client configuration, not service-account secrets. Never put Firebase Admin credentials in an Expo environment variable.

For a physical Android device, EXPO_PUBLIC_NEXORA_API_URL must use a reachable development host/LAN address or HTTPS tunnel. localhost refers to the device itself, not the Codespace or developer computer.

## Security boundaries

- Firebase ID tokens are credentials; do not log or persist them in feature code.
- The provider subject is not a Dignity user ID.
- The internal user ID is the UUID returned by Nexora Identity.
- Service-account and Firebase Admin credentials are server-only.
- Registration does not accept a client-selected privileged role. Authorization and institutional membership must be granted by Nexora Core/Dignity backend policy.
