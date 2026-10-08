# Third-party diagram assets

The infrastructure palette includes 64 searchable third-party tools, grouped under **Third-party tools**, alongside cloud, Kubernetes and generic assets. Cost-workspace palettes link to the infrastructure diagram for visual tools; they do not create priced cloud resources.

| Area | Included tools |
| --- | --- |
| Databases and search | MongoDB, PostgreSQL, MySQL, Redis, SQLite, ClickHouse, Neo4j, Cassandra, Elasticsearch, OpenSearch |
| Messaging | Kafka, RabbitMQ, NATS |
| Source and CI/CD | GitHub, GitHub Actions, GitLab, Bitbucket, Jenkins, CircleCI, Buildkite, Argo CD, Flux, Tekton |
| Quality and artifacts | SonarQube, Sonatype Nexus, JFrog Artifactory |
| Infrastructure | Docker, Terraform, OpenTofu, Ansible, Pulumi, Helm, Vault, Consul |
| Networking | NGINX, Traefik, HAProxy, Istio, Envoy, Cloudflare |
| Observability | Prometheus, Grafana, Loki, OpenTelemetry, Jaeger, Datadog, New Relic, Sentry, Splunk, Fluent Bit |
| Identity | Keycloak, Auth0, Okta |
| Hosting and storage | Vercel, Netlify, Supabase, MinIO |
| Data and AI | Airflow, Spark, dbt, MLflow, Ollama, Hugging Face, Jupyter |

Search by product name or terms such as CI, CD, continuous integration, GitOps, database, monitoring, tracing, secrets or infrastructure as code. Matching is local. These are visual components, with no implied deployment integration or subscription pricing.

Original labeled SVG badges are stored in the backend asset directory and seeded into PostgreSQL using the existing asset pipeline. No runtime vendor-logo downloads are used. Badge provenance is recorded in the asset manifest and attribution document. Run `pnpm --filter @planner/backend seed` after updating an existing installation, then refresh the client after the catalog cache expires (up to 60 seconds).

Asset IDs use `tools/<id>`. Existing IDs, drawing schema and version remain unchanged. New tools persist through the existing drawing JSON, storage and export projection. Older application builds without these registry entries cannot import drawings referencing the new tools; update readers first. Pricing, cloud AI output and architecture resource contracts are unaffected.
