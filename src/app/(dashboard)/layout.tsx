import { Sidebar } from '@/components/layout/Sidebar'
import { AppHeader } from '@/components/layout/AppHeader'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DataLoader } from '@/components/layout/DataLoader'
import { IssueDetailPanel } from '@/components/issues/IssueDetailPanel'
import { WorkspaceColorProvider } from '@/components/layout/WorkspaceColorProvider'
import { NotificationsProvider } from '@/components/layout/NotificationsProvider'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <TooltipProvider>
      <DataLoader>
        <WorkspaceColorProvider />
        {user && <NotificationsProvider userId={user.id} />}
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <AppHeader />
            <main className="flex-1 overflow-auto bg-muted/20">{children}</main>
          </div>
        </div>
      </DataLoader>
      <IssueDetailPanel />
    </TooltipProvider>
  )
}
