# ADR: Local Nexora Control Plane

- Status: Accepted
- Date: 2026-09-20

## Context

The Nexora Core backend serves multiple product domains from the Django modular monolith. During local development, developers need a direct view of backend health, registered API routes, domain services, and recent HTTP activity without inspecting logs manually.

## Decision

Add a development-only Control Plane at `/ops/` inside `services/nexora-api/`.

The Control Plane:

- is enabled only when Django `DEBUG=True`;
- exposes a server-rendered dashboard and a JSON snapshot endpoint;
- inventories registered Django routes dynamically;
- reports database connectivity and Firebase configuration state;
- lists the currently integrated Nexora API/domain services;
- keeps a bounded in-memory request activity buffer;
- never stores request bodies, authorization headers, credentials, or tokens.

The telemetry is intentionally process-local and bounded. It is a development observability aid, not a production monitoring system.

## Consequences

Positive:
- Faster local verification of backend changes.
- Clear visibility into which API domains are registered.
- No additional runtime dependency.
- No production exposure when DEBUG is disabled.

Limitations:
- Request history is lost on restart.
- In-memory telemetry is per process.
- Production observability should use dedicated metrics/logging infrastructure later.

## Control Center identity boundary

The local Control Plane is an internal operator surface, not the public Nexora Office product.

Access now requires:

- Django DEBUG mode;
- a verified Firebase identity;
- an explicit Control Plane principal;
- an enabled principal record;
- a server-side session created after successful identity verification.

Initial owner bootstrapping is restricted to emails listed in `CONTROL_PLANE_BOOTSTRAP_EMAILS`. The allowlist only creates the principal after Firebase verification reports a verified email. Once created, access is controlled by the persisted principal record; an absent or disabled principal is denied.

The bootstrap allowlist is intentionally separate from future role/permission governance. Step 2 will add explicit Control Center roles and permissions without weakening this identity boundary.

The Control Center login never stores the Firebase ID token in the Django session; only the internal NEXORA user UUID is stored.
