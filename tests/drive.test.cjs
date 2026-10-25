const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
const {createStorage}=require('../electron/storage.cjs');const {createDrive}=require('../electron/drive.cjs');
test('Drive creates a multipart appData backup, updates it, refreshes tokens and downloads it',async t=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'cute-drive-'));const storage=await createStorage(directory);
  const originalFetch=global.fetch;
  t.after(()=>{global.fetch=originalFetch;storage.close();fs.rmSync(directory,{recursive:true,force:true});});
  storage.setting('driveClientId','test.apps.googleusercontent.com');storage.setting('driveClientSecret','desktop-config');
  const safeStorage={isEncryptionAvailable:()=>true,encryptString:s=>Buffer.from('encrypted:'+s),decryptString:b=>b.toString().slice(10)};
  fs.writeFileSync(path.join(directory,'google-tokens.bin'),safeStorage.encryptString(JSON.stringify({access_token:'old-token',refresh_token:'refresh',expiresAt:0})));
  const calls=[];let existing=false;const backup=storage.backup();
  global.fetch=async(url,opts={})=>{calls.push({url,opts});
    if(url.includes('oauth2.googleapis.com/token')){assert.equal(opts.body.get('grant_type'),'refresh_token');return Response.json({access_token:'new-token',expires_in:3600});}
    if(url.includes('uploadType=multipart')){assert(opts.body.includes(Buffer.from('appDataFolder')));assert(opts.headers['Content-Type'].includes('multipart/related'));existing=true;return Response.json({id:'cloud-id'});}
    if(url.includes('uploadType=media')){assert.equal(opts.method,'PATCH');assert(opts.body[0]===0x1f);return Response.json({id:'cloud-id'});}
    if(url.includes('alt=media'))return new Response(backup);
    if(url.includes('/drive/v3/files?'))return Response.json({files:existing?[{id:'cloud-id'}]:[]});
    if(url.includes('/revoke'))return new Response('');
    throw new Error('Unexpected URL '+url);
  };
  const drive=createDrive({directory,storage,safeStorage,shell:{},onStatus:()=>{}});
  await drive.upload();assert(storage.snapshot().settings.lastSync);assert.equal(drive.status().busy,false);
  await drive.upload();assert(calls.some(c=>c.opts.method==='PATCH'));
  assert.deepEqual(await drive.download(),backup);
  const saved=safeStorage.decryptString(fs.readFileSync(path.join(directory,'google-tokens.bin')));assert.equal(JSON.parse(saved).refresh_token,'refresh');
  const before=storage.snapshot();global.fetch=async()=>{throw new Error('Offline');};await assert.rejects(()=>drive.upload(),/Offline/);assert.deepEqual(storage.snapshot(),before);assert.equal(drive.status().connected,true);assert.equal(drive.status().busy,false);
  await drive.disconnect();assert.equal(drive.status().connected,false);assert.equal(fs.existsSync(path.join(directory,'google-tokens.bin')),false);
});
