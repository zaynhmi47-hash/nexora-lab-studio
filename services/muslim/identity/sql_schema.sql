CREATE TABLE IF NOT EXISTS nexora_identities (
    user_id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS nexora_provider_accounts (
    id UUID PRIMARY KEY,
    provider VARCHAR(64) NOT NULL,
    provider_subject VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL REFERENCES nexora_identities(user_id),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_nexora_provider_subject UNIQUE (provider, provider_subject)
);

CREATE INDEX IF NOT EXISTS ix_nexora_provider_accounts_user_id
    ON nexora_provider_accounts(user_id);
