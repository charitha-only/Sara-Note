import {useState} from 'react';
import {Plus,X} from 'lucide-react';
import {lightColors} from './colors';
export default function ColorPicker({label,onAdd}:{label:string;onAdd:(color:string)=>void}){
 const [open,setOpen]=useState(false),[color,setColor]=useState('#f5e3f6');
 return <span className="custom-color"><button className="color-add" aria-label={'Add custom '+label+' color'} title={'Add custom '+label+' color'} onClick={()=>setOpen(!open)}><Plus size={15}/></button>{open&&<div className="color-popover" role="dialog" aria-label={label+' color picker'}><header><strong>Make it your color</strong><button aria-label="Close color picker" onClick={()=>setOpen(false)}><X size={16}/></button></header><p>Soft colors to start, every color to explore.</p><div className="light-palette">{lightColors.map(c=><button key={c} aria-label={'Choose '+c} style={{background:c}} onClick={()=>setColor(c)}/>)}</div><label>Any color <input type="color" aria-label={label+' custom color'} value={/^#[\da-f]{6}$/i.test(color)?color:'#ffffff'} onChange={e=>setColor(e.target.value)}/></label><input aria-label={label+' hex color'} value={color} maxLength={7} onChange={e=>setColor(e.target.value)} placeholder="#f5e3f6"/><button className="primary-button" disabled={!/^#[\da-f]{6}$/i.test(color)} onClick={()=>{onAdd(color.toLowerCase());setOpen(false);}}>Add to my color circles</button></div>}</span>;
}
