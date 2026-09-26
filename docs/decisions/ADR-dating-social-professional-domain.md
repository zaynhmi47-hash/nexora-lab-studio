# ADR: Dating Social Professional domain boundary

- Status: Accepted
- Date: 2026-09-26

## Context

The repository already defines Dating Social Professional as a product/domain boundary. Mature Expo dating repositories provide useful implementation patterns, but their authentication, backend and infrastructure must not be copied into Nexora.

## Decision

Implement Dating Social Professional as a Django domain module inside Nexora Core's modular monolith and an independently structured Expo SDK 57 client.

The first vertical slice owns:
- dating profile;
- discovery;
- swipe;
- reciprocal match detection.

Nexora Core continues to own canonical identity, authorization and shared platform capabilities.

The mobile app uses Expo Router 57 and TanStack Query. Server state and match outcomes remain authoritative on the backend.

Swipe writes are idempotent per actor/target pair using a database uniqueness constraint. Mutual likes create a canonical match with deterministic user ordering.

Kafka, Eureka, Keycloak, or a separate dating microservice are not introduced at this stage. Extraction remains possible after ownership, contracts, persistence and operational requirements justify it.

## Consequences

The first implementation is simpler to deploy and test while retaining a clear service-ready domain boundary. Safety features such as block/report must be implemented before production messaging is enabled.
