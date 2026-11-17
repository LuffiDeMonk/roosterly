import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  const [backendStatus, setBackendStatus] = useState<string>('Checking...')

  useEffect(() => {
    fetch('/api')
      .then((res) => res.json())
      .then((data: { message?: string }) => setBackendStatus(data.message || 'Running'))
      .catch((err: unknown) => {
        console.error('ERROR:', err)
        setBackendStatus('Backend unreachable')
      })
  }, [])

  return (
    <main className="container mx-auto max-w-2xl py-12 px-4 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Roosterly</CardTitle>
            <Badge variant="outline">Healthcare & Shift Management</Badge>
          </div>
          <CardDescription>
            Multi-tenant workforce scheduling and roster management platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 border flex items-center justify-between">
            <span className="text-sm font-medium">Backend Status:</span>
            <Badge variant={backendStatus.toLowerCase().includes('running') ? 'default' : 'secondary'}>
              {backendStatus}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
            <div className="p-2.5 rounded border bg-card/60">
              <span className="font-semibold text-foreground block">🗓️ 7-Day Rosters</span>
              Weekly matrix scheduling with draft and published states.
            </div>
            <div className="p-2.5 rounded border bg-card/60">
              <span className="font-semibold text-foreground block">🔄 3-Phase Shift Swaps</span>
              Peer claim with supervisor atomic approval workflows.
            </div>
            <div className="p-2.5 rounded border bg-card/60">
              <span className="font-semibold text-foreground block">🌴 Leave & Availability</span>
              Conflict detection and preference-aware staffing.
            </div>
            <div className="p-2.5 rounded border bg-card/60">
              <span className="font-semibold text-foreground block">🏥 Staffing Ratios</span>
              Ward coverage metrics for morning, evening, and night shifts.
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button>Launch Workspace</Button>
            <Button variant="outline">View Rosters</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
