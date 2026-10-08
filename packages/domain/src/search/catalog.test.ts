import { describe, expect, it } from 'vitest';
import { searchServices, searchAssets, resolveService, serviceKey } from './catalog';
describe('cross-provider catalog search',()=>{
 it('finds compute and ECS-related container services for a generic server query',()=>{
  const results=searchServices('server'),keys=results.map(serviceKey);
  expect(new Set(results.map(service=>service.provider)).size).toBe(5);
  expect(keys).toEqual(expect.arrayContaining(['aws/ec2','aws/fargate','azure/vm','azure/container-apps','gcp/compute','gcp/cloud-run','oracle/compute','ibm/virtual-server','ibm/catalog-codeengine']));
 });
 it('finds cross-cloud container alternatives for ECS and Docker',()=>{
  for(const query of ['ECS','docker','container'])expect(searchServices(query).map(serviceKey)).toEqual(expect.arrayContaining(['aws/fargate','gcp/cloud-run','azure/container-apps','oracle/catalog-container-instances']));
 });
 it('matches Elasticsearch to search services without treating ElastiCache as Elasticsearch',()=>{
  const keys=searchServices('Elasticsearch').map(serviceKey);
  expect(keys).toEqual(expect.arrayContaining(['aws/catalog-opensearch','oracle/catalog-opensearch','ibm/catalog-databases-for-elasticsearch']));
  expect(keys).not.toContain('aws/elasticache');
 });
 it('supports provider qualifiers, generic database terms and case/spacing normalization',()=>{
  expect(searchServices('  GOOGLE server ').every(service=>service.provider==='gcp')).toBe(true);
  expect(searchServices('azure server').map(serviceKey)).toContain('azure/container-apps');
  expect(searchServices('postgres').map(serviceKey)).toEqual(expect.arrayContaining(['aws/rds','azure/postgres','gcp/cloud-sql']));
  expect(searchServices('blob').map(serviceKey)).toEqual(expect.arrayContaining(['aws/s3','azure/blob','gcp/storage']));
 });
 it('ranks literal matches first and is deterministic, with no duplicate provider/name entries',()=>{
  expect(searchServices('EC2')[0].id).toBe('ec2');
  expect(searchServices('server')).toEqual(searchServices('server'));
  expect(searchServices('').filter(service=>service.provider==='gcp'&&service.name==='Compute Engine')).toHaveLength(1);
  expect(searchServices('not-a-real-service-xyz')).toEqual([]);
 });
 it('searches visual assets across libraries and preserves provider-qualified identities',()=>{
  const assets=searchAssets('server');
  expect(assets.map(asset=>asset.id)).toContain('generic/server');
  expect(assets.some(asset=>asset.library==='gcp')).toBe(true);
  expect(resolveService('oracle/compute','aws')?.provider).toBe('oracle');
  expect(resolveService('compute','gcp')?.provider).toBe('gcp');
  expect(resolveService('invalid/provider/service','aws')).toBeUndefined();
 });
});

describe('third-party tool discovery',()=>{
 it('finds named tools and CI/CD keyword matches',()=>{
  expect(searchAssets('MongoDB')[0].id).toBe('tools/mongodb');
  expect(searchAssets('GitHub')[0].id).toBe('tools/github');
  expect(searchAssets('CI').map(asset=>asset.id)).toEqual(expect.arrayContaining(['tools/jenkins','tools/github-actions','tools/gitlab','tools/circleci']));
  expect(searchAssets('continuous integration').map(asset=>asset.id)).toContain('tools/jenkins');
  expect(searchAssets('monitoring').map(asset=>asset.id)).toEqual(expect.arrayContaining(['tools/grafana','tools/prometheus','tools/datadog']));
  expect(searchAssets('tools secrets').map(asset=>asset.id)).toContain('tools/vault');
 });
 it('keeps third-party tools separate from priced provider services',()=>{
  const tools=searchAssets('tools').filter(asset=>asset.library==='tools');
  expect(tools).toHaveLength(64);
  expect(new Set(tools.map(asset=>asset.id)).size).toBe(64);
  expect(tools.every(asset=>asset.library==='tools'&&asset.icon.startsWith('/drawing-assets/tools/'))).toBe(true);
  expect(searchServices('jenkins')).toEqual([]);
 });
});
