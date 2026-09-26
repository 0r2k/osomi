'use client';
import { useCallback,useEffect,useState } from 'react';
export function Favorite({fixed=false}:{fixed?:boolean}){
 const [active,setActive]=useState(false);const [revision,setRevision]=useState(0);const [busy,setBusy]=useState(true);const [error,setError]=useState('');
 const load=useCallback(async()=>{const response=await fetch('/api/preferences',{cache:'no-store'});const data=await response.json();if(!response.ok)throw new Error(data.error);setActive(data.active);setRevision(data.revision);return data;},[]);
 useEffect(()=>{let alive=true;const refresh=()=>{load().catch(e=>{if(alive)setError(e.message);}).finally(()=>{if(alive)setBusy(false);});};refresh();window.addEventListener('focus',refresh);return()=>{alive=false;window.removeEventListener('focus',refresh);};},[load]);
 async function toggle(){setBusy(true);setError('');try{
  let response=await fetch('/api/preferences',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'initialize'})});let data=await response.json();if(!response.ok)throw new Error(data.error);
  response=await fetch('/api/preferences',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({active:!active,revision,requestId:crypto.randomUUID()})});data=await response.json();if(!response.ok)throw new Error(data.error);setActive(data.active);setRevision(data.revision);
 }catch(e){setError(e instanceof Error?e.message:'No pudimos guardar.');await load().catch(()=>{});}finally{setBusy(false);}}
 return <div className={fixed?'favorite favorite-fixed':'favorite'}><button disabled={busy} aria-pressed={active} onClick={toggle}><span aria-hidden="true">{active?'♥':'♡'}</span><span className="favorite-label">{active?'Te encanta este tema':'Me encanta este tema'}</span></button>{error&&<p role="alert">{error}</p>}</div>;
}
