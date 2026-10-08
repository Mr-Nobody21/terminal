import {describe,it,expect} from 'vitest';
import {ProjectRepository} from './repository';
import {sampleProject} from '@planner/domain/examples';
import {serializeProject} from '@planner/domain/model';
describe('local repository',()=>{
  it('persists and reloads validated snapshots',async()=>{const name=crypto.randomUUID();const r=new ProjectRepository(name),p=sampleProject();await r.save(p);r.close();const reopened=new ProjectRepository(name);expect(await reopened.load(p.id)).toEqual(p);await reopened.delete();});
  it('migrates persisted version 1 records and resaves as version 3',async()=>{const r=new ProjectRepository(crypto.randomUUID()),p=sampleProject();await r.transaction('rw',r.projects,async()=>{await r.table('projects').put({...p,version:1});});expect(await r.load(p.id)).toEqual(p);await r.save((await r.load(p.id))!);expect((await r.projects.get(p.id))?.version).toBe(3);await r.delete();});
  it('invalid imports leave existing records untouched',async()=>{const r=new ProjectRepository(crypto.randomUUID()),p=sampleProject();await r.save(p);await expect(r.import(JSON.stringify({...p,version:99}))).rejects.toThrow();expect(await r.list()).toEqual([p]);const valid=sampleProject();await r.import(serializeProject(valid));expect(await r.list()).toHaveLength(2);await r.remove(p.id);expect(await r.load(p.id)).toBeUndefined();await r.delete();});
  it('save failure leaves the caller snapshot unchanged',async()=>{const r=new ProjectRepository(crypto.randomUUID()),p=sampleProject();r.close();await expect(r.save(p)).rejects.toThrow();expect(p.name).toBe('Web application architecture');});
});
