import { describe,it,expect } from 'vitest';
import { sampleProject } from './sample';
import { activeVariant,commit,deleteResource,duplicateProject,importProject,parseProject,serializeProject,validationErrors } from './model';
describe('canonical version 1',()=>{
  it('round-trips losslessly and preserves IDs',()=>{const p=sampleProject();expect(importProject(serializeProject(p))).toEqual(p);});
  it('remaps duplication references and presentation',()=>{const p=sampleProject();const id=activeVariant(p).resources[0].id;p.presentation.positions[id]={x:42,y:20};const d=duplicateProject(p);expect(d.id).not.toBe(p.id);expect(activeVariant(d).resources[0].id).not.toBe(id);expect(Object.values(d.presentation.positions)).toEqual([{x:42,y:20}]);expect(validationErrors(d)).toEqual([]);});
  it('preserves literal UUID text while remapping entity references',()=>{const p=sampleProject();p.requirementsText=p.id;p.sources[0].text=p.id;p.variants[0].description=p.id;const copy=duplicateProject(p);expect(copy.requirementsText).toBe(p.id);expect(copy.sources[0].text).toBe(p.id);expect(copy.variants[0].description).toBe(p.id);expect(copy.id).not.toBe(p.id);});
  it('rejects future versions and unknown fields including credentials',()=>{const p=sampleProject();expect(()=>parseProject({...p,version:2})).toThrow('Unsupported project version');expect(()=>parseProject({...p,apiKey:'secret'})).toThrow();});
  it('rejects invalid provider/service and dangling endpoints',()=>{const p=sampleProject();activeVariant(p).resources[0].service='cloud-run';expect(validationErrors(p)[0].path).toContain('service');activeVariant(p).connections[0].source=crypto.randomUUID();expect(validationErrors(p).length).toBeGreaterThan(1);});
  it('rejects duplicate IDs, missing provenance and cyclic boundaries',()=>{const p=sampleProject();const v=activeVariant(p);v.resources[1].id=v.resources[0].id;v.boundaries[0].parentId=v.boundaries[0].id;v.resources[0].configuration.inputs.cpu.source.id=crypto.randomUUID();expect(validationErrors(p).length).toBeGreaterThanOrEqual(3);});
  it('atomically removes incident connections and positions',()=>{const p=sampleProject();const id=activeVariant(p).resources[1].id;p.presentation.positions[id]={x:1,y:2};const d=deleteResource(p,id);expect(activeVariant(d).connections).toHaveLength(0);expect(d.presentation.positions[id]).toBeUndefined();expect(activeVariant(p).resources).toHaveLength(4);});
  it('requires exact catalog constant values and units',()=>{const p=sampleProject();activeVariant(p).resources[0].configuration.inputs.hours.value=42;expect(validationErrors(p)[0].message).toContain('catalog constant');});
  it('validates commands before accepting changes',()=>{const p=sampleProject();expect(()=>commit(p,d=>{d.name='';})).toThrow();expect(p.name).not.toBe('');});
  it.each(['aws','azure','gcp'] as const)('seeds valid %s examples',provider=>expect(validationErrors(sampleProject(provider))).toEqual([]));
});
