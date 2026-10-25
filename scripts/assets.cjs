const fs=require('node:fs');const path=require('node:path');
const fonts=path.resolve('node_modules/@excalidraw/excalidraw/dist/prod/fonts');
if(!fs.existsSync(fonts))throw new Error('Excalidraw font assets not found');
fs.mkdirSync('dist/excalidraw',{recursive:true});
fs.cpSync(fonts,'dist/excalidraw/fonts',{recursive:true});
