import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WorkspaceSettingsForm } from '@/components/workspace/WorkspaceSettingsForm'
import { DangerZone } from '@/components/workspace/DangerZone'
import { ThemeSettings } from '@/components/layout/ThemeSettings'
import { User, ExternalLink } from 'lucide-react'

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace: slug } = await params
  const supabase = await createClient()

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!workspace) redirect('/')

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Ayarlar"
        description="Workspace yapılandırması ve tercihler"
      />

      <div className="grid grid-cols-[1fr_340px] gap-5 mt-2">
        {/* Sol sütun: Genel */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Genel</CardTitle>
              <CardDescription>Workspace adı ve görünümü</CardDescription>
            </CardHeader>
            <CardContent>
              <WorkspaceSettingsForm
                workspaceId={workspace.id}
                name={workspace.name}
                color={workspace.color ?? '#6366f1'}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sağ sütun: Görünüm + Hesap + Tehlikeli Bölge */}
        <div className="space-y-5">
          {/* Görünüm */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Görünüm</CardTitle>
              <CardDescription>Tema tercihleri</CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSettings />
            </CardContent>
          </Card>

          {/* Hesap */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Hesap</CardTitle>
              <CardDescription>Profil ve kişisel ayarlar</CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/profile"
                className="flex items-center justify-between p-3 rounded-xl border border-subtle hover:bg-subtle/60 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <User size={14} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-foreground">Profilini yönet</p>
                    <p className="text-[11px] text-muted">Ad, unvan ve e-posta</p>
                  </div>
                </div>
                <ExternalLink size={13} className="text-muted group-hover:text-foreground transition-colors" />
              </Link>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-rose-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-rose-400">Tehlikeli Bölge</CardTitle>
              <CardDescription>Kalıcı ve geri alınamaz işlemler</CardDescription>
            </CardHeader>
            <CardContent>
              <DangerZone workspaceId={workspace.id} workspaceName={workspace.name} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
