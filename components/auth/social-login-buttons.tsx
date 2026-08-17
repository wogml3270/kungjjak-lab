'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Provider = 'google' | 'kakao';

export function SocialLoginButtons() {
  const [loading, setLoading] = useState<Provider>();
  const [errorMessage, setErrorMessage] = useState('');

  async function signIn(provider: Provider) {
    setLoading(provider);
    setErrorMessage('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/` },
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(undefined);
    }
  }

  return (
    <div className="mt-7 space-y-4">
      <motion.button
        className="neo-button w-full bg-[#FEE500]"
        disabled={Boolean(loading)}
        onClick={() => void signIn('kakao')}
        type="button"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        {loading === 'kakao' ? '카카오로 이동 중…' : '카카오로 계속하기'}
      </motion.button>
      <motion.button
        className="neo-button w-full bg-white"
        disabled={Boolean(loading)}
        onClick={() => void signIn('google')}
        type="button"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        {loading === 'google' ? 'Google로 이동 중…' : 'Google로 계속하기'}
      </motion.button>
      {errorMessage ? (
        <p className="text-center text-sm font-bold text-red-700">{errorMessage}</p>
      ) : null}
    </div>
  );
}
