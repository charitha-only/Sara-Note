const {contextBridge,ipcRenderer}=require('electron');
const invoke=(channel)=>(...args)=>ipcRenderer.invoke(channel,...args);
contextBridge.exposeInMainWorld('cute',{
  snapshot:invoke('snapshot'),saveNote:invoke('note:save'),deleteNote:invoke('note:delete'),
  saveTodo:invoke('todo:save'),deleteTodo:invoke('todo:delete'),setting:invoke('setting'),
  exportBackup:invoke('backup:export'),importBackup:invoke('backup:import'),
  exportText:invoke('text:export'),importText:invoke('text:import'),exportImage:invoke('image:export'),
  exportDocument:invoke('document:export'),exportFolder:invoke('export:folder'),checkUpdate:invoke('update:check'),installUpdate:invoke('update:install'),
  sticky:invoke('sticky'),minimize:invoke('minimize'),maximize:invoke('maximize'),close:invoke('close'),
  driveStatus:invoke('drive:status'),driveConnect:invoke('drive:connect'),driveDisconnect:invoke('drive:disconnect'),driveUpload:invoke('drive:upload'),driveRestore:invoke('drive:restore'),
  dataFolder:invoke('data:folder'),flushDone:invoke('flush:done'),
  onChange:fn=>{const listener=(_,kind)=>fn(kind);ipcRenderer.on('changed',listener);return()=>ipcRenderer.removeListener('changed',listener);},
  onFlush:fn=>{const listener=()=>fn();ipcRenderer.on('flush',listener);return()=>ipcRenderer.removeListener('flush',listener);},
  onAction:fn=>{const listener=(_,action)=>fn(action);ipcRenderer.on('action',listener);return()=>ipcRenderer.removeListener('action',listener);}
});
