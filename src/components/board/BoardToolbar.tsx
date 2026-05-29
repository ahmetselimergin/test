'use client'

import { Filter, SlidersHorizontal, LayoutList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Project } from '@/lib/supabase/types'

interface BoardToolbarProps {
  project: Project
  issueCount: number
  filterBarOpen: boolean
  onFilterToggle: () => void
  activeFilterCount: number
}

export function BoardToolbar({ project, issueCount, filterBarOpen, onFilterToggle, activeFilterCount }: BoardToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-border bg-card/50">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="size-9 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ backgroundColor: project.color }}
        >
          {project.key}
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-semibold truncate text-foreground">{project.name}</h1>
          <p className="text-xs text-muted-foreground">
            Kanban board · <span className="font-mono">{issueCount}</span> issues
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="font-mono text-[11px] hidden sm:inline-flex">
          {project.key}
        </Badge>
        <Separator orientation="vertical" className="h-5 hidden sm:block" />
        <Button
          variant={filterBarOpen ? 'secondary' : 'outline'}
          size="sm"
          className="gap-1.5 h-8 text-xs"
          onClick={onFilterToggle}
        >
          <Filter size={14} />
          Filter
          {activeFilterCount > 0 && (
            <Badge variant="default" className="ml-1 h-4 min-w-4 px-1 text-[10px] rounded-full">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs hidden sm:inline-flex">
          <SlidersHorizontal size={14} />
          Group
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs hidden md:inline-flex">
          <LayoutList size={14} />
          Columns
        </Button>
      </div>
    </div>
  )
}
