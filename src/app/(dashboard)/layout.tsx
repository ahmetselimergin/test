import { Sidebar } from '@/components/layout/Sidebar'
import { AppHeader } from '@/components/layout/AppHeader'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DataLoader } from '@/components/layout/DataLoader'
import { IssueDetailPanel } from '@/components/issues/IssueDetailPanel'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TooltipProvider>
      <DataLoader>
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <AppHeader />
            <main className="flex-1 overflow-auto bg-subtle/30">{children}</main>
          </div>
        </div>
      </DataLoader>
      <IssueDetailPanel />
    </TooltipProvider>
  )
}
