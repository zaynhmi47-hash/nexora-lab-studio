# Mobile infrastructure boundaries

- `api/`: provider-neutral Nexora Core API client and errors.
- `auth/`: application authentication boundary and provider adapters.
- `config/`: non-secret runtime configuration.
- `organization/`: active organization and tenant context.

Route files under `app/` should consume these boundaries rather than constructing infrastructure clients directly.
