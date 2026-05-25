'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Trash2 } from 'lucide-react'
import { useIssueStore } from '@/lib/stores/issue.store'
import { useProjectStore } from '@/lib/stores/project.store'
import { TypeIcon } from './TypeIcon'
import { PriorityBadge } from './PriorityBadge'
import { StatusBadge } from './StatusBadge'
import { IssueEditor } from './IssueEditor'
import { formatIssueId } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { IssueStatus, Priority } from '@/lib/supabase/types'

export function IssueDetailPanel() {
  const { selectedIssue, setSelectedIssue, updateIssue, removeIssue } = useIssueStore()
  const { currentProject } = useProjectStore()

  async function handleDelete() {
    if (!selectedIssue) return
    const supabase = createClient()
    await supabase.from('issues').delete().eq('id', selectedIssue.id)
    removeIssue(selectedIssue.id)
  }

  async function handleStatusChange(status: IssueStatus) {
    if (!selectedIssue) return
    updateIssue(selectedIssue.id, { status })
    const supabase = createClient()
    await supabase.from('issues').update({ status }).eq('id', selectedIssue.id)
  }

  async function handlePriorityChange(priority: Priority) {
    if (!selectedIssue) return
    updateIssue(selectedIssue.id, { priority })
    const supabase = createClient()
    await supabase.from('issues').update({ priority }).eq('id', selectedIssue.id)
  }

  const statuses: IssueStatus[] = ['todo', 'in_progress', 'review', 'done']
  const priorities: Priority[] = ['critical', 'high', 'medium', 'low']

  return (
    <AnimatePresence>
      {selectedIssue && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={() => setSelectedIssue(null)}
          />
          {/* Panel */}
          <motion.aside
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[440px] z-50 flex flex-col bg-card border-l border-subtle shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-subtle flex-shrink-0">
              <div className="flex items-center gap-2">
                <TypeIcon type={selectedIssue.type} size={16} />
                <span className="text-xs text-muted font-mono">
                  {currentProject &&
                    formatIssueId(currentProject.key, selectedIssue.issue_number)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="w-7 h-7">
                  <ExternalLink size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 text-rose-400 hover:text-rose-300"
                  onClick={handleDelete}
                >
                  <Trash2 size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7"
                  onClick={() => setSelectedIssue(null)}
                >
                  <X size={14} />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              <h2 className="text-lg font-semibold leading-snug">
                {selectedIssue.title}
              </h2>

              {/* Meta fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-xs text-muted block">Durum</span>
                  <div className="flex flex-col gap-1">
                    {statuses.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className={`flex items-center gap-2 px-2 py-1 rounded text-left text-xs transition-colors ${
                          selectedIssue.status === s
                            ? 'bg-indigo-500/15 text-indigo-300'
                            : 'hover:bg-white/5 text-muted'
                        }`}
                      >
                        <StatusBadge status={s} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted block">Öncelik</span>
                  <div className="flex flex-col gap-1">
                    {priorities.map((p) => (
                      <button
                        key={p}
                        onClick={() => handlePriorityChange(p)}
                        className={`flex items-center gap-2 px-2 py-1 rounded text-left text-xs transition-colors ${
                          selectedIssue.priority === p
                            ? 'bg-indigo-500/15 text-indigo-300'
                            : 'hover:bg-white/5 text-muted'
                        }`}
                      >
                        <PriorityBadge priority={p} showLabel />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description editor */}
              <div className="space-y-2">
                <span className="text-xs text-muted block">Açıklama</span>
                <IssueEditor
                  issueId={selectedIssue.id}
                  initialContent={selectedIssue.description ?? ''}
                />
              </div>

              {/* Labels */}
              {selectedIssue.labels.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-muted block">Etiketler</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedIssue.labels.map((label) => (
                      <span
                        key={label}
                        className="text-xs bg-white/5 border border-white/10 rounded px-2 py-0.5 text-muted"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
