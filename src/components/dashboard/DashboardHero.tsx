'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface DashboardHeroProps {
  userName: string
  assignedCount: number
  doneTodayCount: number
  criticalBugCount: number
  assignedHref: string
  doneTodayHref: string
  criticalBugHref: string
}

function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const start = performance.now()
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      setValue(Math.round(progress * target))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])

  return value
}

interface StatCardProps {
  count: number
  label: string
  emoji: string
  bgColor: string
  borderColor: string
  textColor: string
  href: string
  delay: number
}

function StatCard({ count, label, emoji, bgColor, borderColor, textColor, href, delay }: StatCardProps) {
  const displayed = useCountUp(count)
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex-1"
    >
      <Link
        href={href}
        className="flex items-center gap-3.5 px-4 py-4 rounded-xl border transition-all hover:brightness-110"
        style={{ background: bgColor, borderColor }}
      >
        <div
          className="size-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: bgColor }}
        >
          {emoji}
        </div>
        <div>
          <div
            className="text-[28px] font-extrabold leading-none tracking-tight tabular-nums"
            style={{ color: textColor }}
          >
            {displayed}
          </div>
          <div className="text-[11px] text-muted mt-1 font-medium">{label}</div>
        </div>
      </Link>
    </motion.div>
  )
}

export function DashboardHero({
  userName,
  assignedCount,
  doneTodayCount,
  criticalBugCount,
  assignedHref,
  doneTodayHref,
  criticalBugHref,
}: DashboardHeroProps) {
  const today = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const firstName = userName.split(' ')[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden border-b border-subtle px-8 py-7 shrink-0"
      style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #0f0e1a 60%, rgb(var(--bg)) 100%)',
      }}
    >
      {/* Ambient glow orbs */}
      <div
        className="pointer-events-none absolute -top-10 -left-10 size-48 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute top-5 right-20 size-36 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)' }}
      />

      <p className="text-[11px] font-semibold uppercase tracking-widest mb-1 relative" style={{ color: '#6366f1' }}>
        {today}
      </p>
      <h1 className="text-[22px] font-bold tracking-tight mb-1 relative" style={{ color: '#f0f0f8' }}>
        Hoşgeldin, {firstName} 👋
      </h1>
      <p className="text-[13px] text-muted mb-6 relative">
        Workspace&apos;indeki son durumu buradan takip edebilirsin
      </p>

      <div className="flex gap-3 relative">
        <StatCard
          count={assignedCount}
          label="Bana Atanan"
          emoji="📋"
          bgColor="rgba(99,102,241,0.18)"
          borderColor="rgba(99,102,241,0.3)"
          textColor="#818cf8"
          href={assignedHref}
          delay={0.1}
        />
        <StatCard
          count={doneTodayCount}
          label="Bugün Biten"
          emoji="✅"
          bgColor="rgba(16,185,129,0.15)"
          borderColor="rgba(16,185,129,0.25)"
          textColor="#34d399"
          href={doneTodayHref}
          delay={0.2}
        />
        <StatCard
          count={criticalBugCount}
          label="Kritik Bug"
          emoji="🐛"
          bgColor="rgba(244,63,94,0.15)"
          borderColor="rgba(244,63,94,0.25)"
          textColor="#fb7185"
          href={criticalBugHref}
          delay={0.3}
        />
      </div>
    </motion.div>
  )
}
