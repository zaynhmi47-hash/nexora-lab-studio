# Nexora Applications

This directory contains frontend applications only.

Each product keeps frontend targets separate from backend services:

```text
apps/<product>/
├── web/       # Web frontend
├── mobile/    # Mobile frontend (when applicable)
└── README.md
```

Backend code does not belong in `apps/`. Use `services/nexora-api/` or `services/workers/` instead.
