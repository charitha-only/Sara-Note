import {create} from 'zustand';
import type {Note,Todo,Settings,Folder} from './types';
type Notice={text:string;error:boolean;id:number};
interface State {notes:Note[];folders:Folder[];saveFolder:(f:Folder)=>Promise<void>;removeFolder:(id:string)=>Promise<void>;todos:Todo[];settings:Settings;active:string|null;tabs:string[];ready:boolean;pending:number;saveError:boolean;notice:Notice|null;init:()=>Promise<void>;refresh:(kind?:string)=>Promise<void>;open:(id:string)=>void;closeTab:(id:string)=>void;newNote:(type?:'text'|'canvas',initial?:Partial<Note>)=>Promise<void>;edit:(id:string,patch:Partial<Note>)=>void;remove:(id:string)=>Promise<void>;todo:(task:string)=>Promise<void>;updateTodo:(t:Todo)=>Promise<void>;removeTodo:(id:string)=>Promise<void>;setting:<K extends keyof Settings>(key:K,value:Settings[K])=>Promise<void>;notify:(text:string,error?:boolean)=>void;}
const drafts=new Map<string,Note>();
const timers=new Map<string,ReturnType<typeof setTimeout>>();
const running=new Set<Promise<unknown>>();
let writes:Promise<unknown>=Promise.resolve();
function track<T>(p:Promise<T>):Promise<T>{running.add(p);p.then(()=>running.delete(p),()=>running.delete(p));return p;}
function syncCount(){useStore.setState({pending:drafts.size});}
function save(id:string):Promise<void>{
  const timer=timers.get(id);if(timer)clearTimeout(timer);timers.delete(id);
  const n=drafts.get(id);if(!n)return Promise.resolve();
  const p=writes.catch(()=>{}).then(()=>window.cute.saveNote(n)).then(()=>{if(drafts.get(id)===n)drafts.delete(id);syncCount();useStore.setState({saveError:false});}).catch(e=>{useStore.setState({saveError:true});throw e;});
  writes=p;return track(p);
}
export async function flush(){
  for(const id of [...drafts.keys()])await save(id);
  await Promise.all([...running]);
  if(drafts.size)throw new Error('Some changes could not be saved. Retry saving before closing.');
}
export const useStore=create<State>((set,get)=>({
  notes:[],folders:[],todos:[],settings:{},active:null,tabs:[],ready:false,pending:0,saveError:false,notice:null,
  init:async()=>{const s=await window.cute.snapshot();const saved=JSON.parse(sessionStorage.getItem('tabs')||'[]') as string[];const tabs=saved.filter(id=>s.notes.some(n=>n.id===id));if(!tabs.length&&s.notes.length)tabs.push(s.notes[0].id);set({...s,tabs,active:tabs[0]||null,ready:true});},
  refresh:async(kind='all')=>{const s=await window.cute.snapshot();if(kind==='todos')set({todos:s.todos});else if(kind==='settings')set({settings:s.settings});else if(kind==='organization'){const valid=new Set(s.folders.map(f=>f.id));for(const [id,n] of drafts)if(n.folderId&&!valid.has(n.folderId))drafts.set(id,{...n,folderId:null});set({folders:s.folders,notes:s.notes.map(n=>drafts.get(n.id)||n)});}else if(kind==='notes')set({notes:s.notes.map(n=>drafts.get(n.id)||n)});else{const tabs=get().tabs.filter(id=>s.notes.some(n=>n.id===id));if(!tabs.length&&s.notes.length)tabs.push(s.notes[0].id);set({...s,tabs,active:tabs.includes(get().active||'')?get().active:tabs[0]||null});}},
  saveFolder:async f=>{await track(window.cute.saveFolder(f));await get().refresh('organization');},
  removeFolder:async id=>{await flush();await track(window.cute.deleteFolder(id));await get().refresh('organization');},
  open:id=>{const tabs=get().tabs.includes(id)?get().tabs:[...get().tabs,id];sessionStorage.setItem('tabs',JSON.stringify(tabs));set({active:id,tabs});},
  closeTab:id=>{const tabs=get().tabs.filter(t=>t!==id);sessionStorage.setItem('tabs',JSON.stringify(tabs));set({tabs,active:get().active===id?tabs[tabs.length-1]||null:get().active});},
  newNote:async(type='text',initial={})=>{await flush();const now=new Date().toISOString();const n:Note={id:crypto.randomUUID(),title:type==='canvas'?'Untitled whiteboard':'Untitled note',content:'',type,language:'markdown',favorite:0,created_at:now,updated_at:now,...initial};await window.cute.saveNote(n);set({notes:[n,...get().notes]});get().open(n.id);},
  edit:(id,patch)=>{const n=get().notes.find(n=>n.id===id);if(!n)return;const next={...n,...patch,updated_at:new Date().toISOString()};drafts.set(id,next);set({notes:get().notes.map(n=>n.id===id?next:n),pending:drafts.size});if(timers.has(id))clearTimeout(timers.get(id));timers.set(id,setTimeout(()=>{save(id).catch(e=>get().notify(e.message,true));},400));},
  remove:async id=>{await flush();await window.cute.deleteNote(id);get().closeTab(id);set({notes:get().notes.filter(n=>n.id!==id)});},
  todo:async task=>{const t:Todo={id:crypto.randomUUID(),task:task.trim(),is_completed:0,is_pinned_desktop:0,created_at:new Date().toISOString()};await track(window.cute.saveTodo(t));set({todos:[...get().todos,t]});},
  updateTodo:async t=>{await track(window.cute.saveTodo(t));set({todos:get().todos.map(x=>x.id===t.id?t:x)});},
  removeTodo:async id=>{await track(window.cute.deleteTodo(id));set({todos:get().todos.filter(t=>t.id!==id)});},
  setting:async(key,value)=>{await track(window.cute.setting(key,value));set({settings:{...get().settings,[key]:value}});},
  notify:(text,error=false)=>{const id=Date.now();set({notice:{text,error,id}});setTimeout(()=>{if(get().notice?.id===id)set({notice:null});},error?9000:4000);}
}));
export async function act<T>(fn:()=>Promise<T>,success?:string){try{const result=await fn();if(success&&result!==null)useStore.getState().notify(success);return result;}catch(e){useStore.getState().notify(e instanceof Error?e.message:String(e),true);}}
