'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/stores/workspace.store'
import { useProjectStore } from '@/lib/stores/project.store'

export function DataLoader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()
    const { setWorkspaces, setCurrentWorkspace } = useWorkspaceStore.getState()
    const { setProjects } = useProjectStore.getState()

    async function load() {
      const { data: workspaces } = await supabase.from('workspaces').select('*')
      if (workspaces?.length) {
        setWorkspaces(workspaces)
        setCurrentWorkspace(workspaces[0])

        const { data: projects } = await supabase
          .from('projects')
          .select('*')
          .eq('workspace_id', workspaces[0].id)
        if (projects) setProjects(projects)
      }
    }
    load()
  }, [pathname])

  return <>{children}</>
}
