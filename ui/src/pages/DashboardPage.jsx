import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { reportsAPI, deploymentsAPI } from "@/services/api"
import {
  Package,
  Users,
  Rocket,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Activity,
} from "lucide-react"

function StatCard({ title, value, description, icon: Icon, trend }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span className="text-xs text-emerald-500">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function DeploymentsByStatus({ data }) {
  const statusColors = {
    not_started: "secondary",
    in_progress: "info",
    blocked: "destructive",
    completed: "success",
  }

  const total = Object.values(data || {}).reduce((a, b) => a + b, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deployments by Status</CardTitle>
        <CardDescription>Current deployment status distribution</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(data || {}).map(([status, count]) => (
          <div key={status} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={statusColors[status] || "default"}>
                  {status.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                </Badge>
                <span className="text-sm text-muted-foreground">{count}</span>
              </div>
              <span className="text-sm font-medium">
                {total > 0 ? Math.round((count / total) * 100) : 0}%
              </span>
            </div>
            <Progress value={total > 0 ? (count / total) * 100 : 0} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function RecentDeployments({ deployments }) {
  const statusIcons = {
    not_started: Clock,
    in_progress: Activity,
    blocked: AlertTriangle,
    completed: CheckCircle,
  }

  const statusColors = {
    not_started: "text-muted-foreground",
    in_progress: "text-blue-500",
    blocked: "text-destructive",
    completed: "text-emerald-500",
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Deployments</CardTitle>
        <CardDescription>Latest deployment activities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {deployments?.slice(0, 5).map((deployment) => {
            const Icon = statusIcons[deployment.status] || Clock
            return (
              <div
                key={deployment.id}
                className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${statusColors[deployment.status]}`} />
                  <div>
                    <div className="font-medium">{deployment.productName}</div>
                    <div className="text-sm text-muted-foreground">
                      {deployment.clientName}
                    </div>
                  </div>
                </div>
                <Badge variant={deployment.status === "completed" ? "success" : "secondary"}>
                  {deployment.status?.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                </Badge>
              </div>
            )
          })}
          {(!deployments || deployments.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent deployments
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: () => reportsAPI.getDashboardMetrics(),
  })

  const { data: deployments, isLoading: deploymentsLoading } = useQuery({
    queryKey: ["recent-deployments"],
    queryFn: () => deploymentsAPI.list({ pageSize: 5, sort: "-createdAt" }),
  })

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const stats = metrics?.data || {
    totalProducts: 0,
    totalClients: 0,
    totalDeployments: 0,
    completedDeployments: 0,
    deploymentsByStatus: {},
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your products, clients, and deployments
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          description="Active products"
        />
        <StatCard
          title="Total Clients"
          value={stats.totalClients}
          icon={Users}
          description="Active clients"
        />
        <StatCard
          title="Total Deployments"
          value={stats.totalDeployments}
          icon={Rocket}
          description="All deployments"
        />
        <StatCard
          title="Completed"
          value={stats.completedDeployments}
          icon={CheckCircle}
          description="Completed deployments"
          trend={stats.totalDeployments > 0 ? `${Math.round((stats.completedDeployments / stats.totalDeployments) * 100)}% completion rate` : undefined}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DeploymentsByStatus data={stats.deploymentsByStatus} />
        <RecentDeployments deployments={deployments?.rows} />
      </div>
    </div>
  )
}
