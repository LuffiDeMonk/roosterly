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
            <Badge variant="outline">TanStack Start + Router</Badge>
          </div>
          <CardDescription>
            Habit tracker & weekly activity scheduler
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 border flex items-center justify-between">
            <span className="text-sm font-medium">Backend Status:</span>
            <Badge variant={backendStatus.includes('running') ? 'default' : 'secondary'}>
              {backendStatus}
            </Badge>
          </div>
          <div className="flex gap-3">
            <Button>shadcn UI Ready</Button>
            <Button variant="outline">Learn More</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
