import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({base:'./',plugins:[react(),{
  name:'excalidraw-offline-fonts',enforce:'pre',
  transform(code,id){
    // Fonts are bundled locally. Remove Excalidraw's unconditional CDN fallback.
    if(!id.includes('/@excalidraw/excalidraw/'))return;
    let result=code.replace(/return (\w+)\.push\(new URL\((\w+),(\w+)\.ASSETS_FALLBACK_URL\)\),\1/g,'return $1');
    // Embed complete local fonts in SVG exports. The upstream font subsetter
    // creates dynamic functions, which our renderer's strict CSP disallows.
    if(result.includes('Failed to use workers for subsetting')){
      const target='return await qd(i,t)';
      if(!result.includes(target))throw new Error('Review the offline font adapter for this Excalidraw version.');
      result=result.replace(target,'return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error("Could not embed font"));reader.readAsDataURL(new Blob([i],{type:"font/woff2"}));})');
    }
    return result;
  }
}],build:{chunkSizeWarningLimit:2500}});
