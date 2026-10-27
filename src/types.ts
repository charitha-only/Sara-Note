export interface Note { id:string; title:string; content:string; language:string; type:'text'|'canvas'; favorite:number; created_at:string; updated_at:string;folderId?:string|null;tags?:string[] }
export interface Todo { id:string; task:string; is_completed:number; is_pinned_desktop:number; created_at:string }
export interface Settings {fontSize?:number;theme?:'light'|'dark';autoSync?:boolean;driveClientId?:string;driveClientSecret?:string;lastSync?:string;stickyText?:string;stickyColor?:string;customInks?:string[];customFills?:string[];customPapers?:string[];workspaceColor?:string;lightThemes?:string[]}
export interface Folder {id:string;name:string}
export interface Snapshot {notes:Note[];folders:Folder[];todos:Todo[];settings:Settings}
export interface DriveStatus {connected:boolean;busy:boolean;lastSync:string|null}
export interface UpdateInfo {current:string;version?:string;available:boolean;url?:string;size?:number}
export interface CuteAPI {
  snapshot():Promise<Snapshot>; saveNote(n:Note):Promise<Note>;deleteNote(id:string):Promise<void>;
  saveFolder(f:Folder):Promise<Folder>;deleteFolder(id:string):Promise<void>;
  saveTodo(t:Todo):Promise<Todo>;deleteTodo(id:string):Promise<void>;setting<K extends keyof Settings>(key:K,value:Settings[K]):Promise<void>;
  exportBackup():Promise<string|null>;importBackup():Promise<{notes:number;todos:number}|null>;
  importText():Promise<{title:string;content:string;language:string}|null>;exportText(n:Note):Promise<string|null>;
  exportImage(p:{extension:'png'|'svg';data:string}):Promise<string|null>;
  exportDocument(p:{title:string;extension:'pdf'|'png'|'jpeg';text?:string;svg?:string;data?:string;background?:string;foreground?:string},batch?:string):Promise<string|null>;
  exportFolder():Promise<string|null>;
  checkUpdate():Promise<UpdateInfo>;installUpdate():Promise<void>;
  sticky():Promise<boolean>;minimize():Promise<void>;maximize():Promise<void>;close():Promise<void>;
  driveStatus():Promise<DriveStatus>;driveConnect():Promise<void>;driveDisconnect():Promise<void>;driveUpload():Promise<DriveStatus>;driveRestore():Promise<unknown>;
  dataFolder():Promise<void>;flushDone(error?:string):Promise<void>;
  onChange(fn:(kind:string)=>void):()=>void;onFlush(fn:()=>void):()=>void;onAction(fn:(action:string)=>void):()=>void;
}
declare global {interface Window {cute:CuteAPI;EXCALIDRAW_ASSET_PATH:string}}
