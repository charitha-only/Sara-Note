import {exportToBlob,exportToSvg} from '@excalidraw/excalidraw';
import type {Note} from './types';
export type ExportFormat='pdf'|'png'|'jpeg'|'svg';
export async function exportNote(note:Note,extension:ExportFormat,background='#fffdf9',batch?:string){
 if(note.type==='text'){if(extension==='svg')throw new Error('Choose PDF, PNG or JPEG for a text note.');const style=getComputedStyle(document.documentElement);return window.cute.exportDocument({title:note.title,extension,text:note.content,background:style.getPropertyValue('--surface').trim()||background,foreground:style.getPropertyValue('--ink').trim()},batch);}
 const scene=note.content?JSON.parse(note.content):{elements:[],appState:{viewBackgroundColor:background},files:{}};
 const options={elements:scene.elements,appState:{...scene.appState,theme:'light' as const,exportBackground:true,exportWithDarkMode:false,exportScale:2},files:scene.files||{}};
 if(extension==='svg'){const svg=(await exportToSvg(options)).outerHTML;return window.cute.exportImage({extension,data:svg});}
 if(extension==='pdf'){const svg=(await exportToSvg(options)).outerHTML;return window.cute.exportDocument({title:note.title,extension,svg,background:scene.appState?.viewBackgroundColor||background},batch);}
 const blob=await exportToBlob({...options,mimeType:extension==='jpeg'?'image/jpeg':'image/png',quality:1});
 const data=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=()=>reject(new Error('Could not export this drawing.'));r.readAsDataURL(blob);});
 return window.cute.exportDocument({title:note.title,extension,data},batch);
}
