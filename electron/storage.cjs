const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const initSqlJs = require('sql.js');
const LIMIT = 50 * 1024 * 1024;
function str(value, label, max = 10000000) {
  if (typeof value !== 'string' || value.length > max) throw new Error(`Invalid ${label}.`);
  return value;
}
function note(value) {
  if (!value || typeof value !== 'object') throw new Error('Invalid note.');
  const n = {id:str(value.id,'note ID',100),title:str(value.title,'title',300),content:str(value.content,'content'),language:str(value.language || 'markdown','language',30),type:value.type,created_at:str(value.created_at,'date',40),updated_at:str(value.updated_at,'date',40),favorite:value.favorite ? 1 : 0};
  if (!n.id || !n.title.trim() || !['text','canvas'].includes(n.type) || !Number.isFinite(Date.parse(n.created_at)) || !Number.isFinite(Date.parse(n.updated_at))) throw new Error('Invalid note metadata.');
  if (n.type === 'canvas' && n.content) { const scene=JSON.parse(n.content); if (!Array.isArray(scene.elements) || !scene.files || typeof scene.files !== 'object') throw new Error('Invalid whiteboard.'); }
  return n;
}
function todo(value) {
  if (!value || typeof value !== 'object') throw new Error('Invalid task.');
  const t={id:str(value.id,'task ID',100),task:str(value.task,'task',2000),is_completed:value.is_completed ? 1:0,is_pinned_desktop:value.is_pinned_desktop ? 1:0,created_at:str(value.created_at,'date',40)};
  if(!t.id || !t.task.trim() || !Number.isFinite(Date.parse(t.created_at))) throw new Error('Invalid task metadata.');
  return t;
}
function decodeBackup(buffer) {
  if (buffer.length > LIMIT) throw new Error('Backup exceeds the 50 MB limit.');
  let data;
  try { data=JSON.parse(zlib.gunzipSync(buffer,{maxOutputLength:LIMIT}).toString('utf8')); } catch { throw new Error('This is not a valid compressed .cutenote backup.'); }
  if (!['CuteNotes','Sara Note'].includes(data.app) || data.version !== 1 || !Array.isArray(data.payload?.notes) || !Array.isArray(data.payload?.todos)) throw new Error('Unsupported backup format.');
  if(data.payload.notes.length > 10000 || data.payload.todos.length > 50000) throw new Error('Backup contains too many items.');
  const notes=data.payload.notes.map(note), todos=data.payload.todos.map(todo);
  if(new Set(notes.map(n=>n.id)).size!==notes.length || new Set(todos.map(t=>t.id)).size!==todos.length) throw new Error('Backup contains duplicate IDs.');
  const sticky={};
  if(data.payload.sticky?.text!==undefined)sticky.text=str(data.payload.sticky.text,'sticky text',40000);
  if(data.payload.sticky?.color!==undefined){const color=str(data.payload.sticky.color,'sticky color',7);if(!/^#[a-f0-9]{6}$/i.test(color))throw new Error('Invalid sticky color.');sticky.color=color;}
  return {notes,todos,sticky};
}
async function createStorage(directory) {
  fs.mkdirSync(directory,{recursive:true});
  const filename=path.join(directory,'cutenotes.sqlite');
  const SQL=await initSqlJs({locateFile:()=>require.resolve('sql.js/dist/sql-wasm.wasm')});
  let db;
  if(fs.existsSync(filename)) {
    // Never replace a damaged database silently. Preserve it for recovery.
    db=new SQL.Database(fs.readFileSync(filename));
    if(db.exec('PRAGMA integrity_check')[0]?.values[0][0]!=='ok') throw new Error('Database integrity check failed. Your file has been preserved.');
  } else db=new SQL.Database();
  db.run(`CREATE TABLE IF NOT EXISTS notes(id TEXT PRIMARY KEY,title TEXT NOT NULL,content TEXT NOT NULL,language TEXT NOT NULL,type TEXT NOT NULL CHECK(type IN ('text','canvas')),created_at TEXT NOT NULL,updated_at TEXT NOT NULL,favorite INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS todos(id TEXT PRIMARY KEY,task TEXT NOT NULL,is_completed INTEGER NOT NULL DEFAULT 0,is_pinned_desktop INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);`);
  function persist(){const tmp=filename+'.tmp'; fs.writeFileSync(tmp,db.export()); fs.renameSync(tmp,filename);}
  function rows(sql,params=[]){const s=db.prepare(sql);try{s.bind(params);const a=[];while(s.step())a.push(s.getAsObject());return a;}finally{s.free();}}
  function atomic(fn){const before=db.export();try{db.run('BEGIN');fn();db.run('COMMIT');persist();}catch(e){db.close();db=new SQL.Database(before);throw e;}}
  function putNote(n){db.run('INSERT OR REPLACE INTO notes VALUES(?,?,?,?,?,?,?,?)',[n.id,n.title,n.content,n.language,n.type,n.created_at,n.updated_at,n.favorite]);}
  function putTodo(t){db.run('INSERT OR REPLACE INTO todos VALUES(?,?,?,?,?)',[t.id,t.task,t.is_completed,t.is_pinned_desktop,t.created_at]);}
  if(!rows("SELECT key FROM settings WHERE key='initialized'").length){
    const now=new Date().toISOString();
    atomic(()=>{putNote(note({id:crypto.randomUUID(),title:'A little space for big ideas',content:'# Welcome to Sara Note ✨\n\nYour thoughts, sketches and little to-dos — together in one cozy place.\n\n## Make yourself at home\n\n• Create a note with the + New note button.\n• Switch languages for code and syntax highlighting.\n• Open a whiteboard to map your next idea.\n• Pin your tasks to keep them on your desktop.\n• Export a .cutenote backup whenever you like.\n\nEverything saves automatically on this computer.\nSinhala works here too: ආයුබෝවන්! 🌿\n\nHappy creating!\n',language:'markdown',type:'text',created_at:now,updated_at:now,favorite:1}));putTodo(todo({id:crypto.randomUUID(),task:'Make a little room for a new idea',created_at:now}));db.run("INSERT INTO settings VALUES('initialized','true')");});
  }
  persist();
  return {
    filename,
    snapshot:()=>({notes:rows('SELECT * FROM notes ORDER BY updated_at DESC'),todos:rows('SELECT * FROM todos ORDER BY created_at'),settings:Object.fromEntries(rows('SELECT * FROM settings').map(s=>[s.key,JSON.parse(s.value)]))}),
    saveNote:value=>{const n=note(value);atomic(()=>putNote(n));return n;},
    deleteNote:id=>{str(id,'ID',100);atomic(()=>db.run('DELETE FROM notes WHERE id=?',[id]));},
    saveTodo:value=>{const t=todo(value);atomic(()=>putTodo(t));return t;},
    deleteTodo:id=>{str(id,'ID',100);atomic(()=>db.run('DELETE FROM todos WHERE id=?',[id]));},
    setting:(key,value)=>{if(!['fontSize','theme','autoSync','driveClientId','driveClientSecret','lastSync','stickyText','stickyColor','customInks','customFills','customPapers','workspaceColor','lightThemes'].includes(key))throw new Error('Unknown setting.');const json=JSON.stringify(value);str(json,'setting',50000);atomic(()=>db.run('INSERT OR REPLACE INTO settings VALUES(?,?)',[key,json]));},
    backup:()=>{const settings=Object.fromEntries(rows('SELECT * FROM settings').map(s=>[s.key,JSON.parse(s.value)]));const json=JSON.stringify({app:'Sara Note',version:1,timestamp:new Date().toISOString(),payload:{notes:rows('SELECT * FROM notes'),todos:rows('SELECT * FROM todos'),sticky:{text:settings.stickyText||'',color:settings.stickyColor||'#fff5ce'}}});if(Buffer.byteLength(json)>LIMIT)throw new Error('This notebook exceeds the 50 MB backup limit. Export large notes separately first.');return zlib.gzipSync(json);},
    importBackup:(buffer,mode='merge')=>{
      if(!['merge','replace'].includes(mode))throw new Error('Invalid restore mode.');
      const data=decodeBackup(buffer);
      fs.mkdirSync(path.join(directory,'recovery'),{recursive:true});
      fs.writeFileSync(path.join(directory,'recovery',`before-restore-${Date.now()}.sqlite`),db.export());
      atomic(()=>{if(mode==='replace')db.run('DELETE FROM notes; DELETE FROM todos;');data.notes.forEach(putNote);data.todos.forEach(putTodo);if(data.sticky.text!==undefined)db.run("INSERT OR REPLACE INTO settings VALUES('stickyText',?)",[JSON.stringify(data.sticky.text)]);if(data.sticky.color!==undefined)db.run("INSERT OR REPLACE INTO settings VALUES('stickyColor',?)",[JSON.stringify(data.sticky.color)]);});
      return {notes:data.notes.length,todos:data.todos.length};
    },
    close:()=>db.close()
  };
}
module.exports={createStorage,decodeBackup};
