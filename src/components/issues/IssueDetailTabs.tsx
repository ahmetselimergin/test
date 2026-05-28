'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { IssueCommentThread } from './IssueCommentThread'
import { IssueActivityLog } from './IssueActivityLog'

interface IssueDetailTabsProps {
  issueId: string
}

export function IssueDetailTabs({ issueId }: IssueDetailTabsProps) {
  const [tab, setTab] = useState<'comments' | 'activity'>('comments')

  return (
    <div className="flex flex-col min-h-0 border-t border-subtle mt-2">
      <div className="flex border-b border-subtle shrink-0">
        {(['comments', 'activity'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-[12px] font-medium border-b-2 transition-colors -mb-px',
              tab === t
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-foreground'
            )}
          >
            {t === 'comments' ? 'Yorumlar' : 'Aktivite'}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === 'comments' ? (
          <IssueCommentThread issueId={issueId} />
        ) : (
          <IssueActivityLog issueId={issueId} />
        )}
      </div>
    </div>
  )
}
