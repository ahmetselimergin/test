'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

function useCountUp(target: number, duration = 700): number {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const start = performance.now()
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(ease * target))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])

  return value
}

interface MetricProps {
  value: number
  label: string
  sublabel: string
  href: string
  accent: string
  delay: number
}

function Metric({ value, label, sublabel, href, accent, delay }: MetricProps) {
  const displayed = useCountUp(value)
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Link
        href={href}
        className="group flex flex-col gap-1 px-5 py-4 rounded-2xl border border-border bg-card hover:border-foreground/15 transition-all duration-200"
      >
        <span
          className="text-[38px] font-black leading-none tabular-nums tracking-tight"
          style={{ color: accent }}
        >
          {displayed}
        </span>
        <span className="text-[13px] font-semibold text-foreground leading-tight">{label}</span>
        <span className="text-[11px] text-muted-foreground leading-tight">{sublabel}</span>
        <span className="mt-1 flex items-center gap-1 text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: accent }}>
          Görüntüle <ArrowRight size={11} />
        </span>
      </Link>
    </motion.div>
  )
}

interface DashboardHeroProps {
  userName: string
  assignedCount: number
  doneTodayCount: number
  criticalBugCount: number
  assignedHref: string
  doneTodayHref: string
  criticalBugHref: string
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="shrink-0 border-b border-border px-8 py-6"
    >
      <div className="flex items-center justify-between gap-8 flex-wrap">
        {/* Greeting */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            {today}
          </p>
          <h1 className="text-[26px] font-bold tracking-tight leading-tight">
            Hoş geldin, <span className="text-primary">{firstName}</span>
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Workspace'indeki son durumu takip et
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <Metric
            value={assignedCount}
            label="Bana Atanan"
            sublabel="aktif issue"
            href={assignedHref}
            accent="#818cf8"
            delay={0.1}
          />
          <Metric
            value={doneTodayCount}
            label="Bugün Tamamlanan"
            sublabel="issue tamamlandı"
            href={doneTodayHref}
            accent="#34d399"
            delay={0.18}
          />
          <Metric
            value={criticalBugCount}
            label="Kritik Bug"
            sublabel="bekliyor"
            href={criticalBugHref}
            accent="#fb7185"
            delay={0.26}
          />
        </div>
      </div>
    </motion.div>
  )
}
