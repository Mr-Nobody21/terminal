import { describe, expect, it } from 'vitest';
import { sampleProject, makeResource } from '../examples/index';
import { activeVariant, duplicateProject, importProject, newId, parseProject, serializeProject, validationErrors } from './index';
import { providers, services, inventorySources } from '../providers/index';
import { estimate } from '../pricing/index';
import inventory from '../../../../data/services/inventory.json';
function mixed() {
 const p=sampleProject(); const v=activeVariant(p);
 for(const [provider,service] of [['azure','vm'],['gcp','compute'],['oracle','compute'],['ibm','virtual-server']] as const) {
  const r=makeResource(p,service,provider);v.resources.push(r);v.connections.push({id:newId(),source:v.resources[0].id,target:r.id,label:'Cross-cloud link'});
 }
 p.presentation.positions[v.resources[4].id]={x:100,y:200};return p;
}
describe('cross-cloud canonical architectures',()=>{
 it('validates and round-trips all five providers with cross-cloud endpoints and positions',()=>{
  const p=mixed();expect(validationErrors(p)).toEqual([]);expect(importProject(serializeProject(p))).toEqual(p);expect(validationErrors(duplicateProject(p))).toEqual([]);
 });
 it('migrates legacy single-cloud projects without changing IDs or content',()=>{
  const p=sampleProject();const {costEnabled: _mode,...old}=p;void _mode;const legacy={...old,version:1};expect(parseProject(legacy)).toEqual(p);expect(legacy.version).toBe(1);
 });
 it('rejects legacy cross-cloud data and invalid resource regions',()=>{
  const p=mixed();expect(()=>parseProject({...p,version:1})).toThrow('Invalid version 1');p.variants[0].resources[4].region='us-east-1';expect(validationErrors(p).some(e=>e.path.endsWith('region'))).toBe(true);
 });
 it('retains known subtotals and marks cross-cloud transfer and catalog services unpriced',()=>{
  const p=mixed(),cost=estimate(p);expect(cost.base).toBe(estimate(sampleProject()).base);expect(cost.complete).toBe(false);expect(cost.warnings.join(' ')).toContain('Cross-cloud connection');
  const entry=services.find(s=>s.provider==='aws'&&s.category==='unsupported')!;const r=makeResource(p,entry.id);expect(r.unsupported).toBe(true);p.variants[0].resources.push(r);expect(estimate(p).resources.at(-1)?.complete).toBe(false);
 });
 it('marks connection transfer incomplete even when both endpoint resources are priced',()=>{
  const p=sampleProject(),v=activeVariant(p);const aws=v.resources.find(r=>r.service==='s3')!;const azure=makeResource(p,'blob','azure');azure.configuration.inputs.storage=structuredClone(aws.configuration.inputs.storage);v.resources=[aws,azure];v.connections=[];v.boundaries=[];delete aws.boundaryId;
  const before=estimate(p);expect(before.complete).toBe(true);v.connections.push({id:newId(),source:aws.id,target:azure.id,label:'Replication'});const after=estimate(p);expect(after.base).toBe(before.base);expect(after.complete).toBe(false);
 });
 it.each(['oracle','ibm'] as const)('seeds a valid unpriced %s example',provider=>{const p=sampleProject(provider);expect(validationErrors(p)).toEqual([]);expect(estimate(p).complete).toBe(false);});
 it('bundles traceable unique inventories for every provider',()=>{
  for(const provider of providers){expect(inventory.services.filter(s=>s.provider===provider).length).toBeGreaterThan(50);expect(inventorySources.find(s=>s.provider===provider)?.url).toMatch(/^https:/);}
  expect(new Set(inventory.services.map(s=>`${s.provider}/${s.id}`)).size).toBe(inventory.services.length);
 });
});
