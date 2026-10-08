CREATE TABLE assets (
 id uuid PRIMARY KEY,
 owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
 logical_key text UNIQUE,
 name text NOT NULL,
 mime_type text NOT NULL,
 size_bytes integer NOT NULL CHECK(size_bytes > 0 AND size_bytes <= 5000000),
 sha256 char(64) NOT NULL,
 storage_provider text NOT NULL DEFAULT 'postgres' CHECK(storage_provider IN ('postgres','s3')),
 storage_key text NOT NULL,
 attribution jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((owner_id IS NULL AND logical_key IS NOT NULL) OR (owner_id IS NOT NULL AND logical_key IS NULL))
);
CREATE TABLE asset_blobs (
 asset_id uuid PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,
 bytes bytea NOT NULL
);
CREATE INDEX assets_owner_idx ON assets(owner_id);
CREATE TABLE projects (
 id uuid NOT NULL,
 owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 document jsonb NOT NULL,
 drawings jsonb NOT NULL DEFAULT '[]',
 revision integer NOT NULL DEFAULT 1 CHECK(revision > 0),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(owner_id,id)
);
