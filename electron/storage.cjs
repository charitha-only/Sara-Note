const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const initSqlJs = require('sql.js');
const LIMIT = 50 * 1024 * 1024;
function folder(value){if(!value||typeof value!=='object')throw new Error('Invalid folder.');const id=str(value.id,'folder ID',100),name=str(value.name,'folder name',80).normalize('NFC').trim();if(!id||!name)throw new Error('Give your folder a name.');return {id,name};}
function tags(value){if(!Array.isArray(value)||value.length>20)throw new Error('Use up to 20 tags per note.');return [...new Set(value.map(v=>str(v,'tag',40).normalize('NFC').trim().replace(/^#+/,'').toLowerCase()).filter(Boolean))];}
function str(value, label, max = 10000000) {
  if (typeof value !== 'string' || value.length > max) throw new Error(`Invalid ${label}.`);
  return value;
}
function note(value) {
  if (!value || typeof value !== 'object') throw new Error('Invalid note.');
  const n = {id:str(value.id,'note ID',100),title:str(value.title,'title',300),content:str(value.content,'content'),language:str(value.language || 'markdown','language',30),type:value.type,created_at:str(value.created_at,'date',40),updated_at:str(value.updated_at,'date',40),favorite:value.favorite ? 1 : 0};
  if (!n.id || !n.title.trim() || !['text','canvas'].includes(n.type) || !Number.isFinite(Date.parse(n.created_at)) || !Number.isFinite(Date.parse(n.updated_at))) throw new Error('Invalid note metadata.');
  if (n.type === 'canvas' && n.content) { const scene=JSON.parse(n.content); if (!Array.isArray(scene.elements) || !scene.files || typeof scene.files !== 'object') throw new Error('Invalid whiteboard.'); }
  if(value.folderId!==undefined)n.folderId=value.folderId===null?null:str(value.folderId,'folder ID',100);
  if(value.tags!==undefined)n.tags=tags(value.tags);
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
  if (!['CuteNotes','Sara Note'].includes(data.app) || ![1,2].includes(data.version) || !Array.isArray(data.payload?.notes) || !Array.isArray(data.payload?.todos)) throw new Error('Unsupported backup format.');
  if(data.payload.notes.length > 10000 || data.payload.todos.length > 50000) throw new Error('Backup contains too many items.');
  const notes=data.payload.notes.map(note), todos=data.payload.todos.map(todo);
  if(new Set(notes.map(n=>n.id)).size!==notes.length || new Set(todos.map(t=>t.id)).size!==todos.length) throw new Error('Backup contains duplicate IDs.');
  if(data.payload.folders!==undefined&&(!Array.isArray(data.payload.folders)||data.payload.folders.length>1000))throw new Error('Invalid backup folders.');
  const folders=(data.payload.folders||[]).map(folder),ids=new Set(folders.map(f=>f.id)),names=new Set(folders.map(f=>f.name.toLowerCase()));
  if(ids.size!==folders.length||names.size!==folders.length)throw new Error('Backup contains duplicate folders.');
  if(notes.some(n=>n.folderId&&!ids.has(n.folderId)))throw new Error('A note references a missing folder.');
  const sticky={};
  if(data.payload.sticky?.text!==undefined)sticky.text=str(data.payload.sticky.text,'sticky text',40000);
  if(data.payload.sticky?.color!==undefined){const color=str(data.payload.sticky.color,'sticky color',7);if(!/^#[a-f0-9]{6}$/i.test(color))throw new Error('Invalid sticky color.');sticky.color=color;}
  return {notes,todos,sticky,folders};
}
async function createStorage(directory,{clock=Date.now}={}) {
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
    CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS folders(id TEXT PRIMARY KEY,name TEXT NOT NULL,name_key TEXT NOT NULL UNIQUE);
    CREATE TABLE IF NOT EXISTS note_meta(note_id TEXT PRIMARY KEY,folder_id TEXT,tags TEXT NOT NULL DEFAULT '[]');
    CREATE TABLE IF NOT EXISTS note_history(id TEXT PRIMARY KEY,note_id TEXT NOT NULL,created_at INTEGER NOT NULL,title TEXT NOT NULL,type TEXT NOT NULL,reason TEXT NOT NULL,snapshot BLOB NOT NULL);
    CREATE INDEX IF NOT EXISTS history_note_time ON note_history(note_id,created_at);`);
  function persist(){const tmp=filename+'.tmp'; fs.writeFileSync(tmp,db.export()); fs.renameSync(tmp,filename);}
  function rows(sql,params=[]){const s=db.prepare(sql);try{s.bind(params);const a=[];while(s.step())a.push(s.getAsObject());return a;}finally{s.free();}}
  function atomic(fn){const before=db.export();try{db.run('BEGIN');fn();db.run('COMMIT');persist();}catch(e){db.close();db=new SQL.Database(before);throw e;}}
  function allNotes(){const meta=new Map(rows('SELECT * FROM note_meta').map(m=>[m.note_id,m]));return rows('SELECT * FROM notes ORDER BY updated_at DESC').map(n=>{const m=meta.get(n.id);return m?{...n,folderId:m.folder_id,tags:JSON.parse(m.tags)}:n;});}
  function allFolders(){return rows('SELECT id,name FROM folders ORDER BY name_key');}
  function putFolder(f){db.run('INSERT OR REPLACE INTO folders(id,name,name_key) VALUES(?,?,?)',[f.id,f.name,f.name.toLowerCase()]);}
  function putNote(n){if(n.folderId&&!rows('SELECT id FROM folders WHERE id=?',[n.folderId]).length)throw new Error('That folder no longer exists. Choose another folder.');db.run('INSERT OR REPLACE INTO notes VALUES(?,?,?,?,?,?,?,?)',[n.id,n.title,n.content,n.language,n.type,n.created_at,n.updated_at,n.favorite]);if(n.folderId!==undefined||n.tags!==undefined)db.run('INSERT OR REPLACE INTO note_meta VALUES(?,?,?)',[n.id,n.folderId||null,JSON.stringify(n.tags||[])]);}
  function putTodo(t){db.run('INSERT OR REPLACE INTO todos VALUES(?,?,?,?,?)',[t.id,t.task,t.is_completed,t.is_pinned_desktop,t.created_at]);}
  function currentNote(id){const n=rows('SELECT * FROM notes WHERE id=?',[id])[0];if(!n)return null;const m=rows('SELECT * FROM note_meta WHERE note_id=?',[id])[0];return m?{...n,folderId:m.folder_id,tags:JSON.parse(m.tags)}:n;}
  function remember(n,reason){
    if(!n)return;const now=clock(),data=zlib.gzipSync(JSON.stringify(n));
    const recent=reason==='automatic'?rows("SELECT id FROM note_history WHERE note_id=? AND reason='automatic' AND created_at>=? ORDER BY created_at DESC,rowid DESC",[n.id,now-60000]):[];
    if(recent.length>=2)db.run('UPDATE note_history SET created_at=?,title=?,type=?,snapshot=? WHERE id=?',[now,n.title,n.type,data,recent[0].id]);
    else db.run('INSERT INTO note_history VALUES(?,?,?,?,?,?,?)',[crypto.randomUUID(),n.id,now,n.title,n.type,reason,data]);
    db.run('DELETE FROM note_history WHERE note_id=? AND id NOT IN (SELECT id FROM note_history WHERE note_id=? ORDER BY created_at DESC,rowid DESC LIMIT 30)',[n.id,n.id]);
    let total=0,count=0;for(const h of rows('SELECT id,length(snapshot) AS bytes FROM note_history ORDER BY created_at DESC,rowid DESC')){total+=h.bytes;count++;if(total>20*1024*1024||count>2000)db.run('DELETE FROM note_history WHERE id=?',[h.id]);}
  }
  function historyPreview(noteId,id){str(noteId,'note ID',100);str(id,'version ID',100);const h=rows('SELECT snapshot FROM note_history WHERE note_id=? AND id=?',[noteId,id])[0];if(!h)throw new Error('This saved version is no longer available.');return note(JSON.parse(zlib.gunzipSync(Buffer.from(h.snapshot),{maxOutputLength:64*1024*1024}).toString('utf8')));}
  if(!rows("SELECT key FROM settings WHERE key='initialized'").length){
    const now=new Date().toISOString();
    atomic(()=>{putNote(note({id:crypto.randomUUID(),title:'A little space for big ideas',content:'# Welcome to Sara Note ✨\n\nYour thoughts, sketches and little to-dos — together in one cozy place.\n\n## Make yourself at home\n\n• Create a note with the + New note button.\n• Switch languages for code and syntax highlighting.\n• Open a whiteboard to map your next idea.\n• Pin your tasks to keep them on your desktop.\n• Export a .cutenote backup whenever you like.\n\nEverything saves automatically on this computer.\nSinhala works here too: ආයුබෝවන්! 🌿\n\nHappy creating!\n',language:'markdown',type:'text',created_at:now,updated_at:now,favorite:1}));putTodo(todo({id:crypto.randomUUID(),task:'Make a little room for a new idea',created_at:now}));db.run("INSERT INTO settings VALUES('initialized','true')");});
  }
  persist();
  return {
    filename,
    snapshot:()=>({notes:allNotes(),folders:allFolders(),todos:rows('SELECT * FROM todos ORDER BY created_at'),settings:Object.fromEntries(rows('SELECT * FROM settings').map(s=>[s.key,JSON.parse(s.value)]))}),
    saveFolder:value=>{const f=folder(value);const duplicate=rows('SELECT id FROM folders WHERE name_key=?',[f.name.toLowerCase()])[0];if(duplicate&&duplicate.id!==f.id)throw new Error('A folder with that name already exists.');if(!duplicate&&allFolders().length>=1000&&!rows('SELECT id FROM folders WHERE id=?',[f.id]).length)throw new Error('You can have up to 1,000 folders.');atomic(()=>putFolder(f));return f;},
    deleteFolder:id=>{str(id,'folder ID',100);atomic(()=>{db.run('UPDATE note_meta SET folder_id=NULL WHERE folder_id=?',[id]);db.run('DELETE FROM folders WHERE id=?',[id]);});},
    saveNote:value=>{const n=note(value),old=currentNote(n.id);atomic(()=>{if(old&&rows("SELECT value FROM settings WHERE key='noteHistory'")[0]?.value!=='false'&&(old.content!==n.content||old.title!==n.title||old.language!==n.language))remember(old,'automatic');putNote(n);});return n;},
    deleteNote:id=>{str(id,'ID',100);atomic(()=>{if(rows("SELECT value FROM settings WHERE key='noteHistory'")[0]?.value!=='false')remember(currentNote(id),'deleted');db.run('DELETE FROM notes WHERE id=?',[id]);db.run('DELETE FROM note_meta WHERE note_id=?',[id]);});},
    historyList:id=>{str(id,'note ID',100);return rows('SELECT id,created_at AS createdAt,title,type,reason,length(snapshot) AS bytes FROM note_history WHERE note_id=? ORDER BY created_at DESC,rowid DESC',[id]);},
    historyPreview,
    historyDeleted:()=>{const seen=new Set();return rows('SELECT note_id AS noteId,title,type,created_at AS createdAt FROM note_history h WHERE NOT EXISTS (SELECT 1 FROM notes n WHERE n.id=h.note_id) ORDER BY created_at DESC,rowid DESC').filter(n=>{if(seen.has(n.noteId))return false;seen.add(n.noteId);return true;});},
    historyCheckpoint:id=>{str(id,'note ID',100);const n=currentNote(id);if(!n)throw new Error('Choose an existing note.');atomic(()=>remember(n,'checkpoint'));},
    historyRestore:(noteId,id)=>{const saved=historyPreview(noteId,id),restored={...saved,folderId:saved.folderId&&rows('SELECT id FROM folders WHERE id=?',[saved.folderId]).length?saved.folderId:null,tags:saved.tags||[],updated_at:new Date(clock()).toISOString()};atomic(()=>{remember(currentNote(noteId),'before-restore');db.run('DELETE FROM note_meta WHERE note_id=?',[noteId]);putNote(restored);});return restored;},
    saveTodo:value=>{const t=todo(value);atomic(()=>putTodo(t));return t;},
    deleteTodo:id=>{str(id,'ID',100);atomic(()=>db.run('DELETE FROM todos WHERE id=?',[id]));},
    setting:(key,value)=>{if(!['fontSize','theme','autoSync','driveClientId','driveClientSecret','lastSync','stickyText','stickyColor','customInks','customFills','customPapers','workspaceColor','lightThemes','autoBackup','noteHistory'].includes(key))throw new Error('Unknown setting.');if(['autoBackup','noteHistory'].includes(key)&&typeof value!=='boolean')throw new Error('Choose on or off.');const json=JSON.stringify(value);str(json,'setting',50000);atomic(()=>db.run('INSERT OR REPLACE INTO settings VALUES(?,?)',[key,json]));},
    backup:()=>{const settings=Object.fromEntries(rows('SELECT * FROM settings').map(s=>[s.key,JSON.parse(s.value)]));const json=JSON.stringify({app:'Sara Note',version:2,timestamp:new Date().toISOString(),payload:{notes:allNotes(),folders:allFolders(),todos:rows('SELECT * FROM todos'),sticky:{text:settings.stickyText||'',color:settings.stickyColor||'#fff5ce'}}});if(Buffer.byteLength(json)>LIMIT)throw new Error('This notebook exceeds the 50 MB backup limit. Export large notes separately first.');return zlib.gzipSync(json);},
    importBackup:(buffer,mode='merge')=>{
      if(!['merge','replace'].includes(mode))throw new Error('Invalid restore mode.');
      const data=decodeBackup(buffer);
      fs.mkdirSync(path.join(directory,'recovery'),{recursive:true});
      fs.writeFileSync(path.join(directory,'recovery',`before-restore-${Date.now()}.sqlite`),db.export());
      atomic(()=>{if(mode==='replace')db.run('DELETE FROM note_meta; DELETE FROM notes; DELETE FROM todos; DELETE FROM folders;');const remap=new Map();for(const f of data.folders){const existing=rows('SELECT id FROM folders WHERE name_key=?',[f.name.toLowerCase()])[0];if(existing)remap.set(f.id,existing.id);else if(rows('SELECT id FROM folders WHERE id=?',[f.id]).length){const id=crypto.randomUUID();putFolder({...f,id});remap.set(f.id,id);}else putFolder(f);}if(allFolders().length>1000)throw new Error('The combined notebook would exceed 1,000 folders.');data.notes.forEach(n=>{db.run('DELETE FROM note_meta WHERE note_id=?',[n.id]);putNote({...n,...(n.folderId?{folderId:remap.get(n.folderId)||n.folderId}:{})});});data.todos.forEach(putTodo);if(data.sticky.text!==undefined)db.run("INSERT OR REPLACE INTO settings VALUES('stickyText',?)",[JSON.stringify(data.sticky.text)]);if(data.sticky.color!==undefined)db.run("INSERT OR REPLACE INTO settings VALUES('stickyColor',?)",[JSON.stringify(data.sticky.color)]);});
      return {notes:data.notes.length,todos:data.todos.length};
    },
    close:()=>db.close()
  };
}
module.exports={createStorage,decodeBackup};
