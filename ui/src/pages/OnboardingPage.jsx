import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { deploymentsAPI } from "@/services/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, ExternalLink, ClipboardList, AlertTriangle } from "lucide-react"

export default function OnboardingPage() {
  const { data: deployments, isLoading } = useQuery({
    queryKey: ["deployments", "onboarding"],
    queryFn: () => deploymentsAPI.list({ status: "in_progress,not_started" }),
  })

  const onboardingDeployments = deployments?.rows?.filter(
    (d) => d.status === "not_started" || d.status === "in_progress"
  ) || []

  const blockedDeployments = deployments?.rows?.filter(
    (d) => d.status === "blocked"
  ) || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const statusColors = {
    not_started: "secondary",
    in_progress: "info",
    blocked: "destructive",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ClipboardList className="h-8 w-8" />
          Onboarding
        </h1>
        <p className="text-muted-foreground">
          Track and manage client onboarding progress
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Not Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {onboardingDeployments.filter((d) => d.status === "not_started").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {onboardingDeployments.filter((d) => d.status === "in_progress").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground text-destructive">
              Blocked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {blockedDeployments.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {blockedDeployments.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Blocked Deployments
            </CardTitle>
            <CardDescription>
              These deployments require immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blockedDeployments.map((deployment) => (
                  <TableRow key={deployment.id}>
                    <TableCell className="font-medium">
                      {deployment.productName}
                    </TableCell>
                    <TableCell>{deployment.clientName}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {deployment.blockedComment || "No reason provided"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/deployments/${deployment.id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active Onboarding</CardTitle>
          <CardDescription>
            Deployments currently being onboarded
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {onboardingDeployments.map((deployment) => (
                <TableRow key={deployment.id}>
                  <TableCell className="font-medium">
                    {deployment.productName}
                  </TableCell>
                  <TableCell>{deployment.clientName}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[deployment.status]}>
                      {deployment.status?.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 w-32">
                      <Progress value={deployment.checklistProgress || 0} className="h-2" />
                      <span className="text-xs text-muted-foreground">
                        {deployment.checklistProgress || 0}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {deployment.environment?.toLowerCase() === "qa"
                        ? "QA"
                        : deployment.environment
                          ? deployment.environment.charAt(0).toUpperCase() + deployment.environment.slice(1)
                          : "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/deployments/${deployment.id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {onboardingDeployments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No active onboarding deployments
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
