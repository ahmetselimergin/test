'use client'
import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Issue, Project } from '@/lib/supabase/types'
import { IssueCard } from '@/components/issues/IssueCard'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'

interface BacklogGroupProps {
  title: string
  issues: Issue[]
  project: Project
  color?: string
}

export function BacklogGroup({ title, issues, project, color }: BacklogGroupProps) {
  const [open, setOpen] = useState(true)

  return (
    <Collapsible open={open} onOpenChange={(nextOpen) => setOpen(nextOpen)} defaultOpen>
      <div className="border border-border rounded-xl overflow-hidden">
        <CollapsibleTrigger className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.02] hover:bg-white/5 transition-colors">
          <motion.div
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronRight size={14} className="text-muted-foreground" />
          </motion.div>
          {color && (
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          )}
          <span className="text-sm font-medium">{title}</span>
          <span className="text-xs text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded-full ml-auto">
            {issues.length}
          </span>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-3 space-y-2">
            {issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} project={project} />
            ))}
            {issues.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Issue yok</p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
