import {it,expect} from 'vitest';
import {sampleProject} from '../../core/sample';
import {activeVariant,newId} from '../../core/model';
import {layoutProject} from './layout';
it('generates a deterministic sorted layout with nested boundaries',async()=>{const p=sampleProject(),v=activeVariant(p);const b={id:newId(),name:'Network',kind:'network' as const,parentId:v.boundaries[0].id};v.boundaries.push(b);v.resources[0].boundaryId=b.id;const first=await layoutProject(p);expect(await layoutProject(p)).toEqual(first);expect(first.nodes.find(n=>n.id===b.id)?.parentId).toBe(b.parentId);expect(first.nodes.find(n=>n.id===v.resources[0].id)?.parentId).toBe(b.id);});
it('honors presentation positions and can generate a fresh layout',async()=>{const p=sampleProject(),id=activeVariant(p).resources[0].id;p.presentation.positions[id]={x:999,y:888};expect((await layoutProject(p)).nodes.find(n=>n.id===id)?.x).toBe(999);expect((await layoutProject(p,false)).nodes.find(n=>n.id===id)?.x).not.toBe(999);});
