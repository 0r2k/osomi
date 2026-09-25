'use client';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
export type AuthMode='login'|'signup'|'recover'|'password';
const copy={login:{title:'Vuelve a tu recorrido.',lead:'Ingresa para recuperar tus favoritos y seguir explorando.',button:'Ingresar'},signup:{title:'Hay más por descubrir.',lead:'Crea tu cuenta para guardar tus temas favoritos y continuar tu recorrido.',button:'Crear mi cuenta'},recover:{title:'Recupera tu acceso.',lead:'Te enviaremos un enlace para elegir una nueva contraseña.',button:'Enviar enlace'},password:{title:'Una nueva contraseña.',lead:'Elige una contraseña de al menos 10 caracteres.',button:'Guardar contraseña'}};
export function AuthForm({mode,notice}:{mode:AuthMode;notice?:string}){
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [error,setError]=useState('');const [visible,setVisible]=useState(false);
 const text=copy[mode];
 async function send(action:string,values:Record<string,string>={}){
  setBusy(true);setMessage('');setError('');
  try{const response=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...values})});const result=await response.json();if(!response.ok)throw new Error(result.error);if(result.url||result.redirect){window.location.assign(result.url||result.redirect);return;}setMessage(result.message);}catch(e){setError(e instanceof Error?e.message:'No pudimos conectar. Inténtalo de nuevo.');}finally{setBusy(false);}
 }
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=new FormData(event.currentTarget);const password=String(form.get('password')??'');if((mode==='signup'||mode==='password')&&password!==form.get('confirm')){setError('Las contraseñas no coinciden.');return;}await send(mode,{email:String(form.get('email')??''),password});}
 return <section className="auth-panel"><p className="eyebrow">TU ESPACIO EN OSOMI</p><h1>{text.title}</h1><p className="intro">{text.lead}</p>{notice&&<p className="notice" role="status">{notice}</p>}
 {(mode==='login'||mode==='signup')&&<><button className="google-button" disabled={busy} onClick={()=>send('google')}>Continuar con Google</button><div className="divider"><span>o con tu correo</span></div></>}
 <form onSubmit={submit}>
 {mode!=='password'&&<label>Correo electrónico<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="tu@correo.com" disabled={busy}/></label>}
 {mode!=='recover'&&<><label>Contraseña<div className="password-field"><input name="password" type={visible?'text':'password'} autoComplete={mode==='login'?'current-password':'new-password'} minLength={mode==='login'?undefined:10} maxLength={128} required disabled={busy}/><button type="button" onClick={()=>setVisible(!visible)} aria-label={visible?'Ocultar contraseña':'Mostrar contraseña'}>{visible?'Ocultar':'Mostrar'}</button></div></label>{mode!=='login'&&<><p className="field-help">Entre 10 y 128 caracteres. Puedes usar una frase.</p><label>Repite la contraseña<input name="confirm" type={visible?'text':'password'} autoComplete="new-password" required minLength={10} maxLength={128} disabled={busy}/></label></>}</>}
 {error&&<p className="error" role="alert">{error}</p>}{message&&<p className="notice" role="status">{message}</p>}
 <button className="primary-button" type="submit" disabled={busy}>{busy?'Un momento…':text.button}</button>
 </form>
 <div className="auth-links">{mode==='login'?<><Link href="/recuperar">Olvidé mi contraseña</Link><span>¿Primera vez? <Link href="/registro">Crea tu cuenta</Link></span></>:<Link href="/acceso">Ya tengo cuenta. Ingresar</Link>}</div>
 <p className="quiet"><Link href="/">Volver a explorar</Link></p></section>;
}
