'use client';

import { motion, MotionConfig } from 'framer-motion';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
      <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 10 }}>
        {children}
      </motion.div>
    </MotionConfig>
  );
}
