import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WorkspaceSettingsForm } from '@/components/workspace/WorkspaceSettingsForm'
import { DangerZone } from '@/components/workspace/DangerZone'
import { ThemeSettings } from '@/components/layout/ThemeSettings'

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
    <div className="p-8 max-w-lg mx-auto space-y-6">
      <PageHeader
        title="Ayarlar"
        description="Workspace yapılandırması ve tercihler"
      />

      {/* Genel Ayarlar */}
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

      {/* Görünüm */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Görünüm</CardTitle>
          <CardDescription>Tema ve arayüz tercihleri</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSettings />
        </CardContent>
      </Card>

      {/* Hesap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hesap</CardTitle>
          <CardDescription>Profil ve kişisel ayarlar</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/profile" className="text-sm text-accent hover:underline">
            Profilini yönet →
          </Link>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-rose-500/20">
        <CardHeader>
          <CardTitle className="text-base text-rose-400">Tehlikeli Bölge</CardTitle>
          <CardDescription>Bu işlemler geri alınamaz</CardDescription>
        </CardHeader>
        <CardContent>
          <DangerZone workspaceId={workspace.id} workspaceName={workspace.name} />
        </CardContent>
      </Card>
    </div>
  )
}
