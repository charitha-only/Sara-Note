const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib');
const pattern=/^(auto|before-restore)-\d{13}-[a-f0-9-]{36}\.cutenote$/;
function createLocalBackup({directory,storage,clock=Date.now}){
 const folder=path.resolve(directory,'auto-backups');let error=null;
 function list(){if(!fs.existsSync(folder))return [];return fs.readdirSync(folder).filter(name=>pattern.test(name)).flatMap(name=>{const file=path.join(folder,name),stat=fs.lstatSync(file);return stat.isFile()&&!stat.isSymbolicLink()?[{id:name,createdAt:Number(name.split('-').slice(name.startsWith('auto-')?1:2)[0]),bytes:stat.size,beforeRestore:name.startsWith('before-restore-')}]:[];}).sort((a,b)=>b.createdAt-a.createdAt||b.id.localeCompare(a.id));}
 function read(id){if(typeof id!=='string'||!pattern.test(id))throw new Error('Choose a local backup from the list.');const file=path.join(folder,id),stat=fs.lstatSync(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>50*1024*1024)throw new Error('Invalid local backup.');return fs.readFileSync(file);}
 const hash=buffer=>crypto.createHash('sha256').update(JSON.stringify(JSON.parse(zlib.gunzipSync(buffer,{maxOutputLength:50*1024*1024})).payload)).digest('hex');
 function create(force=false,beforeRestore=false){try{if(!force&&storage.snapshot().settings.autoBackup===false)return null;const data=storage.backup(),existing=list();let unchanged=false;if(!force&&existing[0])try{unchanged=hash(read(existing[0].id))===hash(data);}catch{}if(unchanged){error=null;return null;}
  fs.mkdirSync(folder,{recursive:true});const id=(beforeRestore?'before-restore-':'auto-')+String(Math.max(clock(),(existing[0]?.createdAt||0)+1)).padStart(13,'0')+'-'+crypto.randomUUID()+'.cutenote',file=path.join(folder,id),temporary=file+'.tmp';
  try{fs.writeFileSync(temporary,data,{flag:'wx'});fs.renameSync(temporary,file);}catch(e){if(fs.existsSync(temporary))fs.unlinkSync(temporary);throw e;}
  let total=0;const retained=list().sort((a,b)=>a.id===id?-1:b.id===id?1:0);for(const [i,item] of retained.entries()){total+=item.bytes;if(i>=7||total>200*1024*1024)fs.unlinkSync(path.join(folder,item.id));}
  error=null;return id;
 }catch(e){error=e.message;throw e;}}
 return {create,read,folder,status:()=>({backups:list(),error})};
}
module.exports={createLocalBackup};
