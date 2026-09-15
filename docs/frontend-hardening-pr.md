# Frontend hardening implementation

This change hardens the Finance Expo Router reference app before using it as the baseline for additional mobile apps.

## Included

- centralized public runtime configuration
- typed API errors and safer error-message parsing
- normalized API URL composition
- stable API/config exports
- local environment and signing-artifact protections
- reserved feature/component/hooks/auth/config boundaries
- frontend CI typecheck workflow
- development documentation and follow-up checklist

## Deliberately deferred

- Firebase client SDK wiring
- authentication implementation
- EAS/build credentials
- shared design-system extraction
- full lint/test matrix

Those should be added after the baseline is validated locally and a second mobile app provides real cross-app requirements.
