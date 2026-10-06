import {it,expect} from 'vitest';
import {useHistory} from './history';
import {sampleProject} from '@planner/domain/examples';
import {commit} from '@planner/domain/model';
it('undoes and redoes canonical and presentation edits',()=>{const p=sampleProject();useHistory.getState().open(p);const d=commit(p,x=>{x.name='Edited';x.presentation.positions[x.variants[0].resources[0].id]={x:40,y:60};});useHistory.getState().apply(d);useHistory.getState().undo();expect(useHistory.getState().project).toEqual(p);useHistory.getState().redo();expect(useHistory.getState().project).toEqual(d);});
