function requirePublicEnv(name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getSupabaseEnv() {
  return {
    url: requirePublicEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: requirePublicEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  };
}
