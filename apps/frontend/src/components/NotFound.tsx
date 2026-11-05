import { Link } from '@tanstack/react-router'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { FileQuestion, Home } from 'lucide-react'

export function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader className="space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="h-7 w-7 text-muted-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">404</CardTitle>
          <CardDescription className="text-base">
            Page Not Found
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The page you requested could not be found or has been moved.
          </p>
          <div className="flex justify-center pt-2">
            <Link to="/" className={buttonVariants({ variant: 'default' })}>
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
