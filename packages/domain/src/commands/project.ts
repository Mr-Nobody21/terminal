import { newId, parseProject, type Project } from '../model/model';
export function duplicateProject(p: Project): Project {
    const ids = [p.id, ...p.sources.map(x => x.id), ...p.requirements.map(x => x.id), ...p.assumptions.map(x => x.id), ...p.variants.flatMap(v => [v.id, ...v.resources.map(x => x.id), ...v.connections.map(x => x.id), ...v.boundaries.map(x => x.id)])];
    const mapping = new Map(ids.map(id => [id, newId()]));
    const referenceKeys=new Set(['id','sourceId','assumptionId','boundaryId','parentId','activeVariantId','source','target']);
    const replace=(value:unknown,key=''):unknown=>typeof value==='string'?(referenceKeys.has(key)?mapping.get(value)??value:value):Array.isArray(value)?value.map(v=>replace(v)):typeof value==='object'&&value!==null?Object.fromEntries(Object.entries(value).map(([k,v])=>[key==='positions'?mapping.get(k)??k:k,replace(v,k)])):value;
    const copy = parseProject(replace(p));
    copy.name = `${p.name} (copy)`;
    copy.createdAt = copy.updatedAt = new Date().toISOString();
    return copy;
}
export const activeVariant = (p: Project) => p.variants.find(v => v.id === p.activeVariantId)!;
export function commit(p: Project, edit: (draft: Project) => void): Project { const draft = structuredClone(p); edit(draft); draft.updatedAt = new Date().toISOString(); return parseProject(draft); }
export function deleteResource(p: Project, id: string) { return commit(p, d => { const v = activeVariant(d); v.resources = v.resources.filter(r => r.id !== id); v.connections = v.connections.filter(c => c.source !== id && c.target !== id); delete d.presentation.positions[id]; }); }
