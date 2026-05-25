'use client'
import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Issue, Project } from '@/lib/supabase/types'
import { IssueCard } from '@/components/issues/IssueCard'
import { cn } from '@/lib/utils'

interface BacklogGroupProps {
  title: string
  issues: Issue[]
  project: Project
  color?: string
}

export function BacklogGroup({ title, issues, project, color }: BacklogGroupProps) {
  const [open, setOpen] = useState(true)

  return (
    <div className="border border-subtle rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.02] hover:bg-white/5 transition-colors"
      >
        <motion.div
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <ChevronRight size={14} className="text-muted" />
        </motion.div>
        {color && (
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        )}
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted bg-white/5 px-1.5 py-0.5 rounded-full ml-auto">
          {issues.length}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-2">
              {issues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} project={project} />
              ))}
              {issues.length === 0 && (
                <p className="text-sm text-muted text-center py-4">Issue yok</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
