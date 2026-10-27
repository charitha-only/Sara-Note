const {BrowserWindow,dialog,nativeImage}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeName=s=>(String(s).replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').replace(/[. ]+$/g,'').slice(0,100)||'Note');
function createExporter(){const batches=new Set();
 return {
  async folder(win){const r=await dialog.showOpenDialog(win,{properties:['openDirectory','createDirectory'],title:'Export every note into a new folder'});if(r.canceled)return null;const dir=path.join(r.filePaths[0],'Sara Note exports '+new Date().toISOString().replace(/[:.]/g,'-'));fs.mkdirSync(dir);batches.add(dir);return dir;},
  async save(win,p,batch){
   if(!p||!['pdf','png','jpeg'].includes(p.extension)||typeof p.title!=='string'||!['text','svg','data'].some(k=>typeof p[k]==='string')||JSON.stringify(p).length>90*1024*1024)throw new Error('Invalid document export.');
   if(batch&&!batches.has(batch))throw new Error('Choose an export folder first.');
   let file;if(batch){file=path.join(batch,safeName(p.title)+'.'+p.extension);for(let i=2;fs.existsSync(file);i++)file=path.join(batch,safeName(p.title)+' ('+i+').'+p.extension);}else{const r=await dialog.showSaveDialog(win,{defaultPath:safeName(p.title)+'.'+p.extension,filters:[{name:p.extension.toUpperCase(),extensions:[p.extension]}]});if(r.canceled)return null;file=r.filePath.toLowerCase().endsWith('.'+p.extension)?r.filePath:r.filePath+'.'+p.extension;}
   if(p.data){if(p.extension==='pdf')throw new Error('Invalid PDF.');const b=Buffer.from(p.data,'base64');if(nativeImage.createFromBuffer(b).isEmpty())throw new Error('Invalid image data.');fs.writeFileSync(file,b);return file;}
   const background=/^#[\da-f]{6}$/i.test(p.background)?p.background:'#fffdf9';
   const foreground=/^#[\da-f]{6}$/i.test(p.foreground)?p.foreground:'#343d36';
   const content=p.svg?`<img alt="Drawing" src="data:image/svg+xml;base64,${Buffer.from(p.svg).toString('base64')}">`:`<h1>${escape(p.title)}</h1><pre>${escape(p.text||'')}</pre>`;
   const html=`<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:"><style>@page{size:A4 ${p.svg?'landscape':'portrait'};margin:14mm}*{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}html,body{margin:0;background:${background};color:${foreground};font-family:'Segoe UI','Nirmala UI',sans-serif}body{padding:40px}h1{font-size:28px;margin:0 0 24px;overflow-wrap:anywhere}pre{font:18px/1.7 'Cascadia Code','Nirmala UI',monospace;white-space:pre-wrap;overflow-wrap:anywhere;margin:0}img{display:block;max-width:100%;height:auto;margin:auto}@media print{body{padding:0}img{width:100%;height:175mm;object-fit:contain}h1{break-after:avoid}pre{font-size:11pt}}</style>${content}`;
   const hidden=new BrowserWindow({show:false,width:1200,height:900,backgroundColor:background,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,offscreen:true}});
   hidden.webContents.setWindowOpenHandler(()=>({action:'deny'}));hidden.webContents.on('will-navigate',e=>e.preventDefault());
   try{await hidden.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent(html));await hidden.webContents.executeJavaScript('Promise.all([document.fonts.ready,...Array.from(document.images,i=>i.decode())]).then(()=>true)');let buffer;
    if(p.extension==='pdf')buffer=await hidden.webContents.printToPDF({printBackground:true,preferCSSPageSize:true});
    else{
     // Rasterize text directly. Capturing a hidden window can wait forever for
     // a compositor frame when Windows throttles background/offscreen windows.
     const data=await hidden.webContents.executeJavaScript(`(()=>{
      const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
      canvas.width=1200;ctx.font="18px 'Cascadia Code','Nirmala UI',monospace";
      const wrap=(text,font)=>{ctx.font=font;const result=[];for(const paragraph of text.split('\\n')){let line='';for(const item of new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(paragraph)){if(ctx.measureText(line+item.segment).width>1120&&line){result.push(line);line='';}line+=item.segment;}result.push(line);}return result;};
      const title=wrap(document.querySelector('h1').textContent,"bold 28px 'Segoe UI','Nirmala UI',sans-serif"),lines=wrap(document.querySelector('pre').textContent,"18px 'Cascadia Code','Nirmala UI',monospace");
      const height=Math.max(120,80+title.length*40+24+lines.length*31);
      if(height>16000)return {error:'This note is too long for one image. Export it as PDF to keep every page.'};
      canvas.height=height;const style=getComputedStyle(document.body);ctx.fillStyle=style.backgroundColor;ctx.fillRect(0,0,1200,height);ctx.fillStyle=style.color;ctx.textBaseline='top';let y=40;
      ctx.font="bold 28px 'Segoe UI','Nirmala UI',sans-serif";for(const line of title){ctx.fillText(line,40,y);y+=40;}y+=24;
      ctx.font="18px 'Cascadia Code','Nirmala UI',monospace";for(const line of lines){ctx.fillText(line,40,y);y+=31;}
      return canvas.toDataURL(${JSON.stringify(p.extension==='png'?'image/png':'image/jpeg')},1).split(',')[1];
     })()`);if(typeof data!=='string')throw new Error(data.error||'Could not export this note.');buffer=Buffer.from(data,'base64');
    }
    fs.writeFileSync(file,buffer);return file;
   }finally{hidden.destroy();}
  }
 };
}
module.exports={createExporter};
