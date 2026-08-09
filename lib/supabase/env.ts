export function getSupabaseEnv() {
  // Next.js replaces NEXT_PUBLIC_* only when accessed through static property names.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing required Supabase public environment variables.');
  }

  return {
    url,
    anonKey,
  };
}
