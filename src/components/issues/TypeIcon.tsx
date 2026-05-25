import { Zap, Star, BookOpen, CheckSquare, Bug, CornerDownRight } from 'lucide-react'
import { typeConfig, cn } from '@/lib/utils'
import type { IssueType } from '@/lib/supabase/types'

const iconMap = {
  zap: Zap,
  star: Star,
  'book-open': BookOpen,
  'check-square': CheckSquare,
  bug: Bug,
  'corner-down-right': CornerDownRight,
}

export function TypeIcon({ type, size = 14 }: { type: IssueType; size?: number }) {
  const config = typeConfig[type]
  const Icon = iconMap[config.icon as keyof typeof iconMap]
  return <Icon size={size} className={cn(config.color)} />
}
