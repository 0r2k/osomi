export function supabaseConfig() {
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if (!url || !key) throw new Error('Configura Supabase en .env.local antes de utilizar autenticación.');
 return { url, key };
}
