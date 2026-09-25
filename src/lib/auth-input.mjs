const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function safeNext(value) { return ['/', '/mi-cuenta', '/actualizar-contrasena'].includes(value) ? value : '/mi-cuenta'; }
export function validEmail(value) { return typeof value==='string' && value.length<=254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
export function validPassword(value) { return typeof value==='string' && value.length>=10 && value.length<=128; }
export function validPreference(value) { return value && typeof value.active==='boolean' && Number.isSafeInteger(value.revision) && value.revision>=0 && typeof value.requestId==='string' && uuid.test(value.requestId); }
export function parseVisitor(value) {
 if(typeof value!=='string') return null;
 const [id,secret,...extra]=value.split('.');
 return uuid.test(id??'') && /^[a-f0-9]{64}$/.test(secret??'') && !extra.length ? {id,secret} : null;
}
