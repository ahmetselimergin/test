import { cn } from '@/lib/utils'

interface IssuePropertyRowProps {
  label: string
  children: React.ReactNode
  className?: string
}

export function IssuePropertyRow({
  label,
  children,
  className,
}: IssuePropertyRowProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-[80px_1fr] gap-3 items-start py-2 border-b border-subtle last:border-0',
        className
      )}
    >
      <span className="text-[12px] font-medium text-muted pt-1">{label}</span>
      <div className="min-w-0 text-[12px]">{children}</div>
    </div>
  )
}
