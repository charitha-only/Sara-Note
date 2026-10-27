import type {ExcalidrawElement} from '@excalidraw/excalidraw/element/types';
export function reorderLayers(elements:readonly ExcalidrawElement[],selection:ReadonlySet<string>,direction:'back'|'backward'|'forward'|'front'){
 // Keep containers, labels and grouped templates together as one stacking unit.
 const units:ExcalidrawElement[][]=[];const owner=new Map<string,ExcalidrawElement[]>();
 for(const el of elements){const keys=[el.id,...el.groupIds,...(el.type==='text'&&el.containerId?[el.containerId]:[]),...(el.boundElements||[]).filter(b=>b.type==='text').map(b=>b.id)];const matches=[...new Set(keys.map(k=>owner.get(k)).filter(Boolean))] as ExcalidrawElement[][];const unit=matches[0]||[];if(!matches.length)units.push(unit);for(const other of matches.slice(1)){unit.push(...other);units.splice(units.indexOf(other),1);for(const [key,value] of owner)if(value===other)owner.set(key,unit);}unit.push(el);keys.forEach(k=>owner.set(k,unit));}
 const selected=(unit:ExcalidrawElement[])=>unit.some(e=>selection.has(e.id));
 if(direction==='back'||direction==='front'){const moved=units.filter(selected),rest=units.filter(u=>!selected(u));return (direction==='front'?[...rest,...moved]:[...moved,...rest]).flat();}
 if(direction==='forward'){for(let i=units.length-2;i>=0;i--)if(selected(units[i])&&!selected(units[i+1]))[units[i],units[i+1]]=[units[i+1],units[i]];}
 else{for(let i=1;i<units.length;i++)if(selected(units[i])&&!selected(units[i-1]))[units[i],units[i-1]]=[units[i-1],units[i]];}
 return units.flat();
}
