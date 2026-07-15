'use client';

import { motion } from 'framer-motion';

export function ConfettiOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][i % 5],
  }));
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', opacity: 0, rotate: 720 }}
          transition={{ duration: 2 + Math.random(), delay: p.delay, ease: 'easeIn' }}
          className="absolute h-3 w-3 rounded-sm"
          style={{ backgroundColor: p.color }}
        />
      ))}
    </div>
  );
}
