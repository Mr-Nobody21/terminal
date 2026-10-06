import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {Inspector} from './Inspector';
import {sampleProject} from '@planner/domain/examples';
import {activeVariant,type Project} from '@planner/domain/model';
afterEach(cleanup);
it('commits a workload edit with explicit user provenance without mutating the source',()=>{const p=sampleProject(),r=activeVariant(p).resources[1],onChange=vi.fn<(p:Project)=>void>();render(<Inspector project={p} selectedId={r.id} onChange={onChange} onSelect={()=>{}}/>);fireEvent.change(screen.getByRole('spinbutton',{name:'cpu input'}),{target:{value:'3'}});const result=onChange.mock.calls[0][0];const input=activeVariant(result).resources[1].configuration.inputs.cpu;expect(input.value).toBe(3);expect(result.assumptions.find(a=>a.id===input.source.id)?.source).toBe('user');expect(r.configuration.inputs.cpu.value).toBe(1);});
it('offers supported catalog replacement for an unsupported resource',()=>{const p=sampleProject(),r=activeVariant(p).resources[0];r.service='imaginary';r.unsupported=true;r.category='unsupported';const onChange=vi.fn<(p:Project)=>void>();render(<Inspector project={p} selectedId={r.id} onChange={onChange} onSelect={()=>{}}/>);fireEvent.change(screen.getByRole('combobox',{name:'Service'}),{target:{value:'s3'}});expect(activeVariant(onChange.mock.calls[0][0]).resources[0].unsupported).toBe(false);expect(activeVariant(onChange.mock.calls[0][0]).resources[0].service).toBe('s3');});
