import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {useState} from 'react';
import {ConfirmationProvider,useConfirmation} from './Confirmation';
function Harness(){const confirm=useConfirmation(),[answer,setAnswer]=useState('pending');return <><button onClick={async()=>setAnswer(String(await confirm('Delete this saved project?',{title:'Delete project?',confirmLabel:'Delete project',danger:true})))}>Request deletion</button><output>{answer}</output></>;}
const originalShow=Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype,'showModal'),originalClose=Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype,'close');
beforeEach(()=>{Object.defineProperty(HTMLDialogElement.prototype,'showModal',{configurable:true,value:vi.fn(function(this:HTMLDialogElement){this.open=true;})});Object.defineProperty(HTMLDialogElement.prototype,'close',{configurable:true,value:vi.fn(function(this:HTMLDialogElement){this.open=false;})});});
afterEach(()=>{cleanup();for(const [key,descriptor] of [['showModal',originalShow],['close',originalClose]] as const){if(descriptor)Object.defineProperty(HTMLDialogElement.prototype,key,descriptor);else Reflect.deleteProperty(HTMLDialogElement.prototype,key);}vi.restoreAllMocks();});
describe('shared confirmations',()=>{
 it('focuses cancellation and returns false without applying the action',async()=>{
  render(<ConfirmationProvider><Harness/></ConfirmationProvider>);const trigger=screen.getByRole('button',{name:'Request deletion'});trigger.focus();fireEvent.click(trigger);
  expect(screen.getByRole('dialog')).toHaveAccessibleName('Delete project?');expect(screen.getByRole('button',{name:'Cancel'})).toHaveFocus();
  fireEvent.click(screen.getByRole('button',{name:'Cancel'}));await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('false'));expect(trigger).toHaveFocus();expect(screen.queryByRole('dialog')).toBeNull();
 });
 it('returns true only from the explicit confirmation button',async()=>{
  render(<ConfirmationProvider><Harness/></ConfirmationProvider>);fireEvent.click(screen.getByRole('button',{name:'Request deletion'}));fireEvent.click(screen.getByRole('button',{name:'Delete project'}));await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('true'));
 });
 it('treats native dialog cancellation as a rejected action',async()=>{
  render(<ConfirmationProvider><Harness/></ConfirmationProvider>);fireEvent.click(screen.getByRole('button',{name:'Request deletion'}));fireEvent(screen.getByRole('dialog'),new Event('cancel',{bubbles:false,cancelable:true}));await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('false'));
 });
});
