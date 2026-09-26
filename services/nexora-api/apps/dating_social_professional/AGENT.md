# Dating Social Professional — Backend Domain Owner

This Django domain owns dating-specific profile, discovery, swipe and match behavior. Shared identity, authorization, notifications, audit, files and provider adapters remain owned by Nexora Core.

## Invariants
- NexoraUser is the canonical actor identity.
- Firebase UID/provider subjects are never dating-domain primary keys.
- Swipe writes are idempotent per actor/target pair.
- A match exists only after reciprocal likes.
- Client state never authorizes access or decides the authoritative match result.
- Block/report/safety enforcement must be introduced before production messaging.

## Service-ready boundary
Keep business rules in services, persistence in models/repositories as the domain grows, and HTTP concerns in api.py. Do not introduce Kafka or a microservice until an operational requirement exists.
