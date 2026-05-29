import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">FT</span>
            </div>
            <span className="font-semibold text-foreground">FlowTrack</span>
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  )
}
