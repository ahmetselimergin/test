import { Sidebar } from '@/components/layout/Sidebar'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DataLoader } from '@/components/layout/DataLoader'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TooltipProvider>
      <DataLoader>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="h-14 border-b border-subtle flex items-center justify-end px-4 gap-2 flex-shrink-0 glass">
              <ThemeToggle />
            </header>
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </div>
      </DataLoader>
    </TooltipProvider>
  )
}
