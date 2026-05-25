import { FolderKanban } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[rgb(var(--bg))] border-r border-subtle">
        {/* Line grid background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgb(var(--border) / 0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgb(var(--border) / 0.4) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
          }}
        />
        {/* Indigo glow at top */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse 70% 40% at 50% -10%, rgb(var(--accent) / 0.4), transparent 70%)',
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-accent flex items-center justify-center">
              <FolderKanban className="text-white" size={18} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">FlowTrack</span>
              <span className="text-[10px] font-medium bg-accent/20 text-accent border border-accent/30 rounded px-1.5 py-0.5 tracking-wide uppercase">
                Beta
              </span>
            </div>
          </div>
          <div className="max-w-md">
            <h2 className="text-2xl font-medium tracking-tight mb-4">
              Ship work the way Jira should feel.
            </h2>
            <p className="text-muted text-sm leading-relaxed">
              Kanban boards, sprints, backlogs, and roadmaps — built for teams
              who want speed without the clutter.
            </p>
          </div>
          <p className="text-xs text-muted">
            Trusted by product & engineering teams
          </p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 bg-[rgb(var(--bg))]">
        <div className="w-full max-w-[360px]">{children}</div>
      </div>
    </div>
  )
}
