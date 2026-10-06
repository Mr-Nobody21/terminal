# Deterministic estimate scope

`estimate(project, variant)` never calls an AI or network. USD known subtotals sum verified rate components. `complete=false` marks resources lacking a catalog SKU, compatible input units, or dimensions; those resources have no line item. Never interpret the numeric known subtotal as a complete bill. Every line item retains input requirement/assumption/catalog references and rate source, snapshot date, SKU, units and exclusions.

The catalog is intentionally bounded to checked rates. Standard Fargate means Linux x86 ECS; standard Cloud Run means instance-based billing. Standard Azure PostgreSQL means B1MS Flexible Server, Blob means Hot LRS, Gateway means Standard v2. VM requires explicit B1s SKU. Missing services/configurations remain unpriced. Azure rates are backed by the checked-in official Retail Prices API selected-meter snapshot, including IDs and effective dates. Google and AWS URLs are official public pricing tables/examples checked 2026-10-06. No taxes, free tier, credits or negotiated discounts. Ancillary service components excluded are disclosed with each resource.

AWS `aws-selected-snapshot.json` stores actual product SKU and on-demand price dimensions from official AWS Price List API (`pricing.us-east-1.amazonaws.com/offers/v1.0/aws/{offer}/current/{region}/index.json`, with global CloudFront). RDS default is db.t4g.micro PostgreSQL Single-AZ with gp2 storage: SKU 9HPEGXQTDDGH53C9 at $0.016/hour and G2TQUMAQNSQ7H65X at $0.115/GiB-month. S3 Standard SKU WP9ANXZGBYYSGJEA is $0.023 first 51200 GiB-month. CloudFront US outbound SKU GV2WFGX37Q9PDSHF is $0.085 first 10240 GiB. General AWS internet egress SKU HQEH3ZWJVT46JHRG is $0.09 first 10240 GiB; the global free allowance is excluded. Above supported tier limits the affected component stays unpriced; tier discounts are not invented. S3/RDS/Fargate explicit egress means external internet bytes for that individual resource; avoid entering the same transfer on multiple resources.

Azure CPU active meter ba69f1c7-e68f-56b1-bc7e-79aa26713625 is $0.000024/vCPU-second; memory active meter f3d673ac-8004-5c9e-a541-8c9eaac1dfea is $0.000003/GiB-second. These are distinct from idle meters. Azure retail rates are filtered to `armRegionName=eastus`, currency USD and Consumption (non-discount) rates. GCP Cloud Run default instance-based model 7754-699E-0EBF is $0.000018/vCPU-second and $0.000002/GiB-second in us-central1. Cloud Storage regional standard is $0.000027397/GiB-hour. Cloud CDN North American first-tier cache delivery is $0.08/GiB. Remaining services have icons and canonical registry support but are explicitly unpriced until verified pricing formulas and components are added.

Seven formula families:

| Family | Formula | Inputs |
|---|---|---|
| Instance | hours × quantity × hourly rate | instance-hours/month |
| Container | hours × quantity × (CPU × CPU rate + memory × memory rate) | vCPU; GiB; hours/month |
| Serverless | requests × (request rate + duration × memory × execution rate) | requests/month; seconds/request; GiB |
| Database | hours × quantity × compute rate + storage × storage rate | instance-hours; GB-month |
| Object storage | storage × storage rate | GB-month |
| Egress | transfer × egress rate | GB/month |
| Load balancer | hours × quantity × base rate + capacity hours × capacity rate | hours; LCU-hours (AWS) or CU-hours (Azure) |

Hours default to the documented canonical `month-hours` constant 730; quantity defaults to `quantity-one`. The existing canonical v1 model uses GB labels for binary memory/storage workload units (GiB-compatible legacy labels); these are treated as GiB, not converted decimal byte counts. Rates per second are converted by exactly 3600 seconds/hour; GCP regional storage hourly rates are converted with 730 hours/month. Catalog amounts are not rounded before aggregation; UI rounds only for display. Low/high multiply the entire modeled workload by explicit canonical scenario multipliers; absent scenarios produce equal bounds with a warning. Fixed-capacity scenario totals therefore describe alternative quantities/durations, not uncertainty in provider rates.

Database compute/storage are priced once per configured resource; `storage` is total allocated storage across its quantity. Operations, backup, disk, public IP, logs, inter-region transfers and minimum-billing effects may need additional workload inputs and catalog support; all remain explicit exclusions rather than silently invented usage.
