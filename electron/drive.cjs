const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const crypto=require('node:crypto');
function createDrive({directory,storage,safeStorage,shell,onStatus}) {
  const tokenPath=path.join(directory,'google-tokens.bin');
  let tokens=null,busy=false,authorizing=false;
  try{if(fs.existsSync(tokenPath)&&safeStorage.isEncryptionAvailable()) tokens=JSON.parse(safeStorage.decryptString(fs.readFileSync(tokenPath)));}catch{}
  function saveTokens(value){if(!safeStorage.isEncryptionAvailable())throw new Error('Windows credential encryption is unavailable.');fs.writeFileSync(tokenPath,safeStorage.encryptString(JSON.stringify(value)));tokens=value;}
  function config(){return storage.snapshot().settings;}
  async function request(url,options={}){const r=await fetch(url,{...options,signal:AbortSignal.timeout(45000)});if(!r.ok){let message='';try{const data=await r.json();message=data.error?.message||data.error_description||'';}catch{}throw new Error(message||`Google Drive request failed (${r.status}).`);}return r;}
  async function exchange(params){const c=config();const body=new URLSearchParams({...params,client_id:c.driveClientId||''});if(c.driveClientSecret)body.set('client_secret',c.driveClientSecret);return (await request('https://oauth2.googleapis.com/token',{method:'POST',body})).json();}
  async function access(){if(!tokens)throw new Error('Connect your Google account first.');if(tokens.expiresAt<Date.now()+60000){if(!tokens.refresh_token)throw new Error('Please reconnect Google Drive.');const t=await exchange({grant_type:'refresh_token',refresh_token:tokens.refresh_token});saveTokens({...tokens,...t,expiresAt:Date.now()+t.expires_in*1000});}return tokens.access_token;}
  async function api(url,options={}){const token=await access();return request(url,{...options,headers:{...options.headers,Authorization:`Bearer ${token}`}});}
  async function files(){const q=new URLSearchParams({spaces:'appDataFolder',q:"name = 'CuteNotes.cutenote' and trashed = false",fields:'files(id,modifiedTime)',orderBy:'modifiedTime desc',pageSize:'100'});return (await (await api('https://www.googleapis.com/drive/v3/files?'+q)).json()).files;}
  async function guarded(fn){if(busy||authorizing)throw new Error('Another Google Drive operation is in progress.');busy=true;onStatus();try{return await fn();}finally{busy=false;onStatus();}}
  return {
    status:()=>({connected:!!tokens,busy:busy||authorizing,lastSync:config().lastSync||null}),
    connect:async()=>{
      if(authorizing||busy)throw new Error('A Google operation is already in progress.');
      const client=config().driveClientId;
      if(typeof client!=='string'||!client.endsWith('.apps.googleusercontent.com'))throw new Error('Add a Google Desktop OAuth client ID in Settings first.');
      if(!safeStorage.isEncryptionAvailable())throw new Error('Windows credential encryption is unavailable.');
      authorizing=true;onStatus();
      try{
        const verifier=crypto.randomBytes(32).toString('base64url'),state=crypto.randomBytes(24).toString('hex');
        let redirect;
        const code=await new Promise((resolve,reject)=>{
          const server=http.createServer(async(req,res)=>{
            const u=new URL(req.url,'http://127.0.0.1');
            if(u.pathname!=='/callback'){res.writeHead(404).end();return;}
            if(u.searchParams.get('state')!==state){res.writeHead(400).end('Invalid request.');return;}
            clearTimeout(timer);server.close();
            if(u.searchParams.has('error')){res.end('Sign-in was cancelled. You can close this tab.');reject(new Error('Google sign-in was cancelled.'));return;}
            const value=u.searchParams.get('code');
            if(!value){res.writeHead(400).end('No authorization code.');reject(new Error('Google returned no authorization code.'));return;}
            res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'"}).end('<body style="background:#faf8f3;font:20px system-ui;padding:60px;color:#3c4145"><h1>All connected. 🌿</h1><p>Return to CuteNotes. You can close this tab.</p></body>');resolve(value);
          });
          const timer=setTimeout(()=>{server.close();reject(new Error('Sign-in timed out. Please try again.'));},180000);
          server.on('error',e=>{clearTimeout(timer);reject(e);});
          server.listen(0,'127.0.0.1',()=>{
            redirect=`http://127.0.0.1:${server.address().port}/callback`;
            const query=new URLSearchParams({client_id:client,redirect_uri:redirect,response_type:'code',scope:'https://www.googleapis.com/auth/drive.appdata',state,code_challenge:crypto.createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256',access_type:'offline',prompt:'consent'});
            shell.openExternal('https://accounts.google.com/o/oauth2/v2/auth?'+query).catch(e=>{clearTimeout(timer);server.close();reject(e);});
          });
        });
        const t=await exchange({grant_type:'authorization_code',code,redirect_uri:redirect,code_verifier:verifier});saveTokens({...t,expiresAt:Date.now()+t.expires_in*1000});
        return {connected:true};
      }finally{authorizing=false;onStatus();}
    },
    disconnect:async()=>{if(busy||authorizing)throw new Error('Wait for the current Google operation to finish.');if(tokens){try{await request('https://oauth2.googleapis.com/revoke',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token:tokens.refresh_token||tokens.access_token})});}catch{ /* Local sign-out remains available offline. */ }}tokens=null;fs.rmSync(tokenPath,{force:true});onStatus();},
    upload:()=>guarded(async()=>{
      const existing=await files(),body=storage.backup();
      if(existing.length){await api(`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(existing[0].id)}?uploadType=media`,{method:'PATCH',headers:{'Content-Type':'application/gzip'},body});}
      else{
        const boundary='cutenotes-'+crypto.randomBytes(12).toString('hex');
        const meta=JSON.stringify({name:'CuteNotes.cutenote',parents:['appDataFolder']});
        const multipart=Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: application/gzip\r\n\r\n`),body,Buffer.from(`\r\n--${boundary}--`)]);
        await api('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',{method:'POST',headers:{'Content-Type':`multipart/related; boundary=${boundary}`},body:multipart});
      }
      storage.setting('lastSync',new Date().toISOString());return {ok:true};
    }),
    download:()=>guarded(async()=>{const existing=await files();if(!existing.length)throw new Error('No CuteNotes backup was found in this Google account.');const response=await api(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(existing[0].id)}?alt=media`);const chunks=[];let total=0;for await(const chunk of response.body){total+=chunk.length;if(total>50*1024*1024)throw new Error('Cloud backup exceeds 50 MB.');chunks.push(Buffer.from(chunk));}return Buffer.concat(chunks);})
  };
}
module.exports={createDrive};
