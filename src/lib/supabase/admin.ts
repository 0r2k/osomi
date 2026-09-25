import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { supabaseConfig } from './config';
export function createAdminClient() {
 const {url}=supabaseConfig();
 const key=process.env.SUPABASE_SECRET_KEY;
 if(!key) throw new Error('Supabase server configuration missing');
 return createClient<Database>(url,key,{auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}});
}
