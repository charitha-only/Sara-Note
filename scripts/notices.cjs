const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),lock=require('../package-lock.json');
const sections=['Sara Note — bundled dependency notices\n\nIncludes notices from the development dependencies used to bundle the renderer. Some listed tools are used only during the build.'];
for(const relative of Object.keys(lock.packages).sort()){
 if(!relative)continue;const dir=path.join(root,relative);if(!fs.existsSync(path.join(dir,'package.json')))continue;
 const pkg=JSON.parse(fs.readFileSync(path.join(dir,'package.json'),'utf8'));
 const files=fs.readdirSync(dir,{withFileTypes:true}).filter(f=>f.isFile()&&/^(licen[sc]e|notice|copying)(\.|$)/i.test(f.name));
 if(files.length)sections.push(`\n${'='.repeat(72)}\n${pkg.name} ${pkg.version}\n${files.map(f=>f.name+'\n\n'+fs.readFileSync(path.join(dir,f.name),'utf8')).join('\n\n')}`);
}
fs.mkdirSync(path.join(root,'licenses'),{recursive:true});
fs.writeFileSync(path.join(root,'licenses/DEPENDENCY-NOTICES.txt'),sections.join('\n\n')+'\n');
console.log('Preserved dependency notices separately from redundant package sources.');
