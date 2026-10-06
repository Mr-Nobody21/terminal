import { newId, parseProject, type Project, type Resource } from './model';
import { regions, serviceFor, type Provider } from './providers';
export function makeResource(p: Project, service: string): Resource { const s = serviceFor(p.provider, service); return { id: newId(), name: s?.name ?? service, service, provider: p.provider, region: p.region, category: s?.category ?? 'unsupported', unsupported: !s, environment: 'production', configuration: { sku: 'standard', inputs: { hours: { value: 730, unit: 'hours/month', source: { kind: 'catalog', id: 'month-hours' } }, quantity: { value: 1, unit: 'count', source: { kind: 'catalog', id: 'quantity-one' } } } } }; }
export function sampleProject(provider: Provider = 'aws'): Project {
    const id = newId(), variantId = newId(), sourceId = newId(), assumptionId = newId();
    const now = new Date().toISOString();
    const p: Project = { version: 1, id, name: 'Web application architecture', createdAt: now, updatedAt: now, provider, region: regions[provider][0], requirementsText: 'A web application with a CDN, container API, PostgreSQL database, and object storage.', sources: [{ id: sourceId, kind: 'user', text: 'Example workload' }], requirements: [{ id: newId(), text: 'Web application with persistent PostgreSQL data', sourceId, critical: true, status: 'known' }], assumptions: [{ id: assumptionId, label: 'Per-resource example workload', value: 'Each service: 1 vCPU; 2 GiB memory; 100 GiB stored; 100 GiB egress monthly. Illustrative, per-resource traffic; do not duplicate shared traffic.', unit: 'monthly workload', source: 'default', critical: false }], variants: [{ id: variantId, name: 'Manual', description: 'Editable onboarding example', resources: [], connections: [], boundaries: [] }], activeVariantId: variantId, presentation: { positions: {} } };
    const ids: Record<Provider, string[]> = { aws: ['cloudfront', 'fargate', 'rds', 's3'], azure: ['front-door', 'container-apps', 'postgres', 'blob'], gcp: ['cdn', 'cloud-run', 'cloud-sql', 'storage'] };
    const boundary = { id: newId(), name: p.region, kind: 'region' as const };
    p.variants[0].boundaries.push(boundary);
    p.variants[0].resources = ids[provider].map(s => { const r = makeResource(p, s); r.boundaryId = boundary.id; for (const [key, value, unit] of [['cpu', 1, 'vCPU'], ['memory', 2, 'GB'], ['storage', 100, 'GB-month'], ['egress', 100, 'GB/month']] as const)
        r.configuration.inputs[key] = { value, unit, source: { kind: 'assumption', id: assumptionId } }; return r; });
    const [cdn, api, db, store] = p.variants[0].resources;
    p.variants[0].connections = [[cdn, api, 'HTTPS'], [api, db, 'SQL'], [api, store, 'Objects']].map(([a, b, label]) => ({ id: newId(), source: (a as Resource).id, target: (b as Resource).id, label: label as string }));
    return parseProject(p);
}
