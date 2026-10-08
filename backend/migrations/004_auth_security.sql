ALTER TABLE users ADD COLUMN auth_version integer NOT NULL DEFAULT 1;
ALTER TABLE sessions ADD COLUMN mfa_verified_at timestamptz;
ALTER TABLE sessions ADD COLUMN last_seen_at timestamptz NOT NULL DEFAULT now();
-- Pre-OTP sessions are retained for expiry cleanup but are no longer accepted.
CREATE INDEX sessions_user_created_idx ON sessions(user_id,created_at DESC);
CREATE TABLE auth_challenges (
 token_hash char(64) PRIMARY KEY,
 user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
 auth_version integer NOT NULL,
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 5),
 expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX challenges_expiry_idx ON auth_challenges(expires_at);
CREATE TABLE security_rate_limits (
 key_hash char(64) PRIMARY KEY,
 attempts integer NOT NULL,
 expires_at timestamptz NOT NULL
);
CREATE INDEX rate_limits_expiry_idx ON security_rate_limits(expires_at);
CREATE TABLE security_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 user_id uuid REFERENCES users(id) ON DELETE SET NULL,
 event text NOT NULL,
 ip_hash char(64) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX security_events_created_idx ON security_events(created_at);
