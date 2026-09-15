# Merge gate

Before merge:

1. Install workspace dependencies with pnpm.
2. Run Finance mobile typecheck.
3. Start Expo and perform a basic route smoke test.
4. Confirm no secrets are present in environment files.

CI covers the typecheck; local Expo/device behavior remains a required manual validation.
