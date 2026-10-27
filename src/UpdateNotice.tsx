import {useEffect,useState} from 'react';
import type {UpdateInfo} from './types';
import {Download,RefreshCw,X} from 'lucide-react';
import {act} from './store';
export default function UpdateNotice({manual=false}:{manual?:boolean}){
 const [info,setInfo]=useState<UpdateInfo|null>(null),[busy,setBusy]=useState(false),[dismissed,setDismissed]=useState(false),[error,setError]=useState('');
 async function check(){setBusy(true);setError('');try{setInfo(await window.cute.checkUpdate());setDismissed(false);}catch(e){if(manual)setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}}
 useEffect(()=>{if(!manual)void check();},[]);
 if(manual)return <div className="update-settings"><button className="outline-button" disabled={busy} onClick={check}><RefreshCw size={16}/>{busy?'Checking…':'Check for updates'}</button>{info&&!info.available&&<p>You have the latest version ({info.current}).</p>}{error&&<p role="status">{error}</p>}{info?.available&&<p>Version {info.version} is ready. <button className="text-button" onClick={()=>{setBusy(true);act(()=>window.cute.installUpdate()).finally(()=>setBusy(false));}} disabled={busy}>download & install</button>.</p>}</div>;
 if(!info?.available||dismissed)return null;
 return <div className="update-banner" role="status"><Download size={19}/><div><strong>Sara Note {info.version} is ready 🌷</strong><p>Your notes stay on this computer. Download the verified Windows installer to update.</p></div><button className="primary-button" disabled={busy} onClick={()=>{setBusy(true);act(()=>window.cute.installUpdate()).finally(()=>setBusy(false));}}>{busy?'Downloading & verifying…':'Download & install'}</button><button aria-label="Remind me next time" disabled={busy} onClick={()=>setDismissed(true)}><X size={18}/></button></div>;
}

