import { z } from 'zod';
import { providers, categories, regions, serviceFor } from '../providers/index';
export const idSchema = z.string().uuid();
export const sourceSchema = z.object({ id: idSchema, kind: z.enum(['user', 'prd', 'inferred']), text: z.string() }).strict();
export const requirementSchema = z.object({ id: idSchema, text: z.string().min(1), sourceId: idSchema, critical: z.boolean(), status: z.enum(['known', 'unknown']), answer: z.string().optional(), assumptionId: idSchema.optional() }).strict();
export const assumptionSchema = z.object({ id: idSchema, label: z.string().min(1), value: z.string(), unit: z.string(), source: z.enum(['user', 'inferred', 'default']), critical: z.boolean() }).strict();
export const pricingInputSchema = z.object({ value: z.number().nonnegative().finite(), unit: z.string().min(1), source: z.object({ kind: z.enum(['requirement', 'assumption', 'catalog']), id: z.string().min(1) }).strict() }).strict();
export const configurationSchema = z.object({ sku: z.string(), inputs: z.record(z.string(), pricingInputSchema), scenarios: z.object({ low: z.number().nonnegative(), high: z.number().nonnegative() }).strict().optional() }).strict();
export const resourceSchema = z.object({ id: idSchema, name: z.string().min(1), provider: z.enum(providers), region: z.string(), service: z.string(), category: z.enum(categories), environment: z.string().min(1), boundaryId: idSchema.optional(), unsupported: z.boolean(), configuration: configurationSchema }).strict();
export const connectionSchema = z.object({ id: idSchema, source: idSchema, target: idSchema, label: z.string() }).strict();
export const boundarySchema = z.object({ id: idSchema, name: z.string().min(1), kind: z.enum(['provider', 'region', 'network', 'subnet']), parentId: idSchema.optional() }).strict();
export const architectureSchema = z.object({ resources: z.array(resourceSchema), connections: z.array(connectionSchema), boundaries: z.array(boundarySchema) }).strict();
export const variantSchema = architectureSchema.extend({ id: idSchema, name: z.enum(['Lean', 'Recommended', 'Manual']), description: z.string() }).strict();
export const positionSchema = z.object({ x: z.number().finite(), y: z.number().finite() }).strict();
export const projectSchema = z.object({ version: z.literal(1), id: idSchema, name: z.string().min(1), createdAt: z.string().datetime(), updatedAt: z.string().datetime(), provider: z.enum(providers), region: z.string(), requirementsText: z.string(), sources: z.array(sourceSchema), requirements: z.array(requirementSchema), assumptions: z.array(assumptionSchema), variants: z.array(variantSchema).min(1), activeVariantId: idSchema, presentation: z.object({ positions: z.record(z.string(), positionSchema) }).strict() }).strict().superRefine((p, ctx) => {
    const error = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message });
    if (!regions[p.provider].includes(p.region))
        error(['region'], 'Region is not supported for this provider');
    const ids = new Set<string>();
    const unique = (id: string, path: (string | number)[]) => { if (ids.has(id))
        error(path, 'Duplicate ID'); ids.add(id); };
    unique(p.id, ['id']);
    const sourceIds = new Set(p.sources.map(s => s.id));
    const assumptionIds = new Set(p.assumptions.map(a => a.id));
    const requirementIds = new Set(p.requirements.map(r => r.id));
    p.sources.forEach((s, i) => unique(s.id, ['sources', i, 'id']));
    p.assumptions.forEach((a, i) => unique(a.id, ['assumptions', i, 'id']));
    p.requirements.forEach((r, i) => { unique(r.id, ['requirements', i, 'id']); if (!sourceIds.has(r.sourceId))
        error(['requirements', i, 'sourceId'], 'Missing source'); if (r.assumptionId && !assumptionIds.has(r.assumptionId))
        error(['requirements', i, 'assumptionId'], 'Missing assumption'); });
    if (!p.variants.some(v => v.id === p.activeVariantId))
        error(['activeVariantId'], 'Missing active variant');
    const presentationIds = new Set<string>();
    p.variants.forEach((v, vi) => {
        unique(v.id, ['variants', vi, 'id']);
        const base = ['variants', vi] as (string | number)[];
        const resourceIds = new Set(v.resources.map(r => r.id));
        const boundaryIds = new Set(v.boundaries.map(b => b.id));
        v.resources.forEach((r, i) => {
            unique(r.id, [...base, 'resources', i, 'id']);
            presentationIds.add(r.id);
            const svc = serviceFor(r.provider, r.service);
            if (r.provider !== p.provider || r.region !== p.region)
                error([...base, 'resources', i, 'provider'], 'Resource must use project provider and region');
            if (!regions[r.provider].includes(r.region))
                error([...base, 'resources', i, 'region'], 'Unsupported region');
            if (!r.unsupported && (!svc || svc.category !== r.category))
                error([...base, 'resources', i, 'service'], 'Invalid provider/service/category');
            if (r.unsupported && r.category !== 'unsupported')
                error([...base, 'resources', i, 'category'], 'Unsupported resources require unsupported category');
            if (r.boundaryId && !boundaryIds.has(r.boundaryId))
                error([...base, 'resources', i, 'boundaryId'], 'Missing boundary');
            Object.entries(r.configuration.inputs).forEach(([key, input]) => { const ref = input.source; if (ref.kind === 'catalog') {
                const constants: Record<string, {
                    value: number;
                    unit: string;
                }> = { 'month-hours': { value: 730, unit: 'hours/month' }, 'quantity-one': { value: 1, unit: 'count' }, 'scenario-base': { value: 1, unit: 'multiplier' } };
                const constant = constants[ref.id];
                if (constant && (input.value !== constant.value || input.unit !== constant.unit))
                    error([...base, 'resources', i, 'configuration', 'inputs', key], 'Input does not match documented catalog constant');
            } if (ref.kind === 'assumption' && !assumptionIds.has(ref.id) || ref.kind === 'requirement' && !requirementIds.has(ref.id) || ref.kind === 'catalog' && !['month-hours', 'quantity-one', 'scenario-base'].includes(ref.id))
                error([...base, 'resources', i, 'configuration', 'inputs', key, 'source'], 'Missing input provenance'); });
            const sc = r.configuration.scenarios;
            if (sc && (sc.low > 1 || sc.high < 1))
                error([...base, 'resources', i, 'configuration', 'scenarios'], 'Scenarios must bracket the base workload');
        });
        v.connections.forEach((c, i) => { unique(c.id, [...base, 'connections', i, 'id']); if (!resourceIds.has(c.source) || !resourceIds.has(c.target))
            error([...base, 'connections', i], 'Missing connection endpoint'); });
        v.boundaries.forEach((b, i) => { unique(b.id, [...base, 'boundaries', i, 'id']); presentationIds.add(b.id); if (b.parentId && !boundaryIds.has(b.parentId))
            error([...base, 'boundaries', i, 'parentId'], 'Missing boundary parent'); const seen = new Set([b.id]); let parent = b.parentId; while (parent) {
            if (seen.has(parent)) {
                error([...base, 'boundaries', i, 'parentId'], 'Cyclic boundary containment');
                break;
            }
            seen.add(parent);
            parent = v.boundaries.find(x => x.id === parent)?.parentId;
        } });
    });
    Object.keys(p.presentation.positions).forEach(id => { if (!presentationIds.has(id))
        error(['presentation', 'positions', id], 'Position refers to missing node'); });
});
export type Project = z.infer<typeof projectSchema>;
export type Resource = z.infer<typeof resourceSchema>;
export type Variant = z.infer<typeof variantSchema>;
export type Assumption = z.infer<typeof assumptionSchema>;
export type PricingInput = z.infer<typeof pricingInputSchema>;
export const newId = () => crypto.randomUUID();
export function parseProject(value: unknown): Project { if (typeof value === 'object' && value !== null && 'version' in value && value.version !== 1)
    throw new Error(`Unsupported project version ${String(value.version)}. This app supports version 1.`); return projectSchema.parse(value); }
export function validationErrors(value: unknown) { const result = projectSchema.safeParse(value); return result.success ? [] : result.error.issues.map(i => ({ path: i.path.join('.'), message: i.message })); }
export const serializeProject = (p: Project) => JSON.stringify(parseProject(p), null, 2);
export const importProject = (text: string) => parseProject(JSON.parse(text));
