# Nexora Cloud — AGENT.md

## Concept
Cloud/storage layer for files, backup, synchronization, shared resources, and future platform infrastructure such as managed services or virtual/server capabilities.

## Instructions
- Separate storage metadata, authorization, and physical providers.
- Use least-privilege access and signed/temporary private-object access.
- Make synchronization conflict-aware and recoverable.
- Treat backup and deletion as explicit lifecycle operations.
- Keep provider-specific code behind adapters.