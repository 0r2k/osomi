'use client';
import { useState } from 'react';
export function AccountActions({pending=false}:{pending?:boolean}){
 const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 async function act(action:string){setBusy(true);setError('');try{const response=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action})});const data=await response.json();if(!response.ok)throw new Error(data.error);window.location.assign(data.redirect);}catch(e){setError(e instanceof Error?e.message:'No pudimos conectar.');setBusy(false);}}
 return <div className="account-actions">{pending&&<><p role="status">Tu sesión está activa. Falta sincronizar el favorito de esta visita.</p><button disabled={busy} onClick={()=>act('reconcile')}>Reintentar sincronización</button></>}<button className="text-button" disabled={busy} onClick={()=>act('signout')}>Cerrar sesión</button>{error&&<p role="alert" className="error">{error}</p>}</div>;
}
