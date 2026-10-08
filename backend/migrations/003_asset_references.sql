CREATE UNIQUE INDEX assets_owner_hash_idx ON assets(owner_id,sha256) WHERE owner_id IS NOT NULL;
CREATE TABLE project_assets (
 owner_id uuid NOT NULL,
 project_id uuid NOT NULL,
 asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
 PRIMARY KEY(owner_id,project_id,asset_id),
 FOREIGN KEY(owner_id,project_id) REFERENCES projects(owner_id,id) ON DELETE CASCADE
);
