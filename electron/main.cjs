const {app,BrowserWindow,ipcMain,dialog,shell,safeStorage,Menu}=require('electron');
const path=require('node:path');
const fs=require('node:fs');
const {createStorage}=require('./storage.cjs');
const {createDrive}=require('./drive.cjs');
if(process.env.CUTENOTES_TEST_DATA)app.setPath('userData',path.resolve(process.env.CUTENOTES_TEST_DATA));
let main,sticky,storage,drive,dirty=false,revision=0,closing=false;
const pendingFlush=new Map();
const single=app.requestSingleInstanceLock();
if(!single)app.quit();
function changed(kind,sender){for(const w of BrowserWindow.getAllWindows())if(w.webContents.id!==sender&&!w.isDestroyed())w.webContents.send('changed',kind);}
function markDirty(){dirty=true;revision++;}
function trusted(event){const win=BrowserWindow.fromWebContents(event.sender);const frame=event.senderFrame;if(!win||!frame||frame!==event.sender.mainFrame)throw new Error('Untrusted request.');const expected=require('node:url').pathToFileURL(path.join(__dirname,'../dist/index.html')).href;if(frame.url.split('#')[0]!==expected)throw new Error('Untrusted page.');return win;}
function handle(channel,fn){ipcMain.handle(channel,async(e,...args)=>{const win=trusted(e);return fn(e,win,...args);});}
function flush(win){if(!win||win.isDestroyed())return Promise.resolve();return new Promise((resolve,reject)=>{const id=win.webContents.id;const timer=setTimeout(()=>{pendingFlush.delete(id);reject(new Error('Saving is taking too long. Please try again.'));},10000);pendingFlush.set(id,{resolve:()=>{clearTimeout(timer);resolve();},reject:e=>{clearTimeout(timer);reject(e);}});win.webContents.send('flush');});}
function createWindow(isSticky=false){
  let stickyClosing=false;
  const win=new BrowserWindow({width:isSticky?355:1320,height:isSticky?490:850,minWidth:isSticky?300:900,minHeight:isSticky?330:610,frame:false,show:false,backgroundColor:isSticky?'#fff5ce':'#faf9f6',alwaysOnTop:isSticky,icon:path.join(__dirname,'../build/icon.ico'),title:isSticky?'CuteNotes · Desktop companion':'CuteNotes',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,spellcheck:true}});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',e=>e.preventDefault());
  win.webContents.session.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
  win.loadFile(path.join(__dirname,'../dist/index.html'),{hash:isSticky?'sticky':''});
  win.once('ready-to-show',()=>win.show());
  win.on('close',e=>{
    if(isSticky){if(!stickyClosing){e.preventDefault();stickyClosing=true;flush(win).then(()=>win.destroy()).catch(error=>{stickyClosing=false;dialog.showMessageBox(win,{type:'error',message:'Your sticky note could not be saved',detail:error.message,buttons:['Keep open']});});}return;}
    if(!closing){e.preventDefault();closing=true;Promise.all([flush(win),flush(sticky)]).then(()=>{sticky?.destroy();win.destroy();app.quit();}).catch(error=>{closing=false;dialog.showMessageBox(win,{type:'error',message:'Your notes could not be saved',detail:error.message,buttons:['Keep CuteNotes open']});});}
  });
  return win;
}
async function restoreBuffer(buffer,win){const {decodeBackup}=require('./storage.cjs');const data=decodeBackup(buffer);const choice=await dialog.showMessageBox(win,{type:'question',title:'Restore CuteNotes backup',message:`Restore ${data.notes.length} notes and ${data.todos.length} tasks?`,detail:'Merge keeps your other notes. Replace restores this backup as your whole notebook. A local recovery copy is saved first.',buttons:['Cancel','Merge','Replace everything'],defaultId:1,cancelId:0});if(!choice.response)return null;await flush(main);await flush(sticky);const result=storage.importBackup(buffer,choice.response===2?'replace':'merge');markDirty();changed('all');return result;}
async function importPath(filename,win){if(path.extname(filename).toLowerCase()!=='.cutenote')throw new Error('Choose a .cutenote backup.');if(fs.statSync(filename).size>50*1024*1024)throw new Error('Backup exceeds 50 MB.');return restoreBuffer(fs.readFileSync(filename),win);}
function register(){
  handle('snapshot',()=>storage.snapshot());
  handle('note:save',(e,_w,n)=>{const value=storage.saveNote(n);markDirty();changed('notes',e.sender.id);return value;});
  handle('note:delete',(e,_w,id)=>{storage.deleteNote(id);markDirty();changed('notes',e.sender.id);});
  handle('todo:save',(e,_w,t)=>{const value=storage.saveTodo(t);markDirty();changed('todos',e.sender.id);return value;});
  handle('todo:delete',(e,_w,id)=>{storage.deleteTodo(id);markDirty();changed('todos',e.sender.id);});
  handle('setting',(e,_w,k,v)=>{storage.setting(k,v);if(k==='stickyText'||k==='stickyColor')markDirty();changed('settings',e.sender.id);});
  handle('flush:done',(e,_w,error)=>{const p=pendingFlush.get(e.sender.id);pendingFlush.delete(e.sender.id);if(error)p?.reject(new Error(String(error)));else p?.resolve();});
  handle('backup:export',async(_e,w)=>{await flush(main);await flush(sticky);const result=await dialog.showSaveDialog(w,{defaultPath:`CuteNotes-${new Date().toISOString().slice(0,10)}.cutenote`,filters:[{name:'CuteNotes backup',extensions:['cutenote']}]});if(result.canceled)return null;const filename=result.filePath.toLowerCase().endsWith('.cutenote')?result.filePath:result.filePath+'.cutenote';fs.writeFileSync(filename,storage.backup());return filename;});
  handle('backup:import',async(_e,w)=>{const r=await dialog.showOpenDialog(w,{filters:[{name:'CuteNotes backup',extensions:['cutenote']}],properties:['openFile']});if(r.canceled)return null;return importPath(r.filePaths[0],w);});
  handle('text:export',async(_e,w,n)=>{if(!n||n.type!=='text'||typeof n.content!=='string')throw new Error('Choose a text note.');const ext={javascript:'js',typescript:'ts',python:'py',cpp:'cpp',html:'html',css:'css',json:'json',markdown:'md',text:'txt'}[n.language]||'txt';const r=await dialog.showSaveDialog(w,{defaultPath:(String(n.title).replace(/[<>:"/\\|?*]/g,'_').slice(0,120)||'Note')+'.'+ext});if(r.canceled)return null;fs.writeFileSync(r.filePath,n.content,'utf8');return r.filePath;});
  handle('text:import',async(_e,w)=>{const r=await dialog.showOpenDialog(w,{properties:['openFile'],filters:[{name:'Text and code',extensions:['txt','md','js','ts','jsx','tsx','py','cpp','c','h','html','css','json','csv','log']}]});if(r.canceled)return null;const f=r.filePaths[0];if(fs.statSync(f).size>10*1024*1024)throw new Error('Text files must be under 10 MB.');const text=fs.readFileSync(f,'utf8');if(text.includes('\u0000'))throw new Error('Please choose a UTF-8 text file.');return {title:path.basename(f),content:text,language:({js:'javascript',jsx:'javascript',ts:'typescript',tsx:'typescript',py:'python',cpp:'cpp',c:'cpp',h:'cpp',html:'html',css:'css',json:'json',md:'markdown'})[path.extname(f).slice(1)]||'text'};});
  handle('image:export',async(_e,w,payload)=>{if(!payload||!['png','svg'].includes(payload.extension)||typeof payload.data!=='string'||payload.data.length>70*1024*1024)throw new Error('Invalid image.');const r=await dialog.showSaveDialog(w,{defaultPath:'Whiteboard.'+payload.extension,filters:[{name:'Whiteboard image',extensions:[payload.extension]}]});if(r.canceled)return null;fs.writeFileSync(r.filePath,payload.extension==='png'?Buffer.from(payload.data,'base64'):payload.data);return r.filePath;});
  handle('sticky',()=>{if(sticky&&!sticky.isDestroyed()){sticky.show();sticky.focus();}else{sticky=createWindow(true);sticky.on('closed',()=>{sticky=null;});}return true;});
  handle('minimize',(_e,w)=>w.minimize());handle('maximize',(_e,w)=>w.isMaximized()?w.unmaximize():w.maximize());handle('close',(_e,w)=>w.close());
  handle('data:folder',()=>shell.openPath(app.getPath('userData')));
  handle('drive:status',()=>drive.status());handle('drive:connect',()=>drive.connect());handle('drive:disconnect',()=>drive.disconnect());
  handle('drive:upload',async()=>{await flush(main);await flush(sticky);const r=revision;await drive.upload();if(revision===r)dirty=false;return drive.status();});
  handle('drive:restore',async(_e,w)=>restoreBuffer(await drive.download(),w));
}
if(single){
  app.on('second-instance',(_e,args)=>{if(main){main.restore();main.show();main.focus();const file=args.find(a=>a.toLowerCase().endsWith('.cutenote'));if(file)importPath(file,main).catch(e=>dialog.showErrorBox('Could not restore backup',e.message));}});
  app.whenReady().then(async()=>{
    storage=await createStorage(app.getPath('userData'));
    dirty=true;
    drive=createDrive({directory:app.getPath('userData'),storage,safeStorage,shell,onStatus:()=>changed('drive')});
    register();Menu.setApplicationMenu(null);main=createWindow();
    const file=process.argv.find(a=>a.toLowerCase().endsWith('.cutenote'));
    if(file)main.webContents.once('did-finish-load',()=>setTimeout(()=>importPath(file,main).catch(e=>dialog.showErrorBox('Could not restore backup',e.message)),1000));
    setInterval(async()=>{if(dirty&&storage.snapshot().settings.autoSync&&drive.status().connected&&!drive.status().busy&&!closing){try{await flush(main);await flush(sticky);const r=revision;await drive.upload();if(r===revision)dirty=false;changed('drive');}catch(e){changed('sync-error:'+e.message);}}},5*60*1000).unref();
  }).catch(e=>{dialog.showErrorBox('CuteNotes could not start',e.message+'\nYour local data has been preserved.');app.quit();});
  app.on('window-all-closed',()=>app.quit());
}
