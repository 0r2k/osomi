import { failure,input,json,rateLimit } from '@/lib/http';
import { initializeVisitor,readPreference,verifiedUser,writePreference } from '@/lib/preferences';
import { validPreference } from '@/lib/auth-input.mjs';
export async function GET(){try{return json(await readPreference());}catch(error){return failure(error);}}
export async function POST(request:Request){
 try{
  const value=await input(request);await rateLimit(request,'preferences',40);
  if(value.action==='initialize'){const {user}=await verifiedUser();if(!user)await initializeVisitor();return json({ready:true});}
  if(!validPreference(value))return json({error:'Datos de favorito no válidos.'},400);
  return json(await writePreference(value.active as boolean,value.revision as number,value.requestId as string));
 }catch(error){return failure(error);}
}
