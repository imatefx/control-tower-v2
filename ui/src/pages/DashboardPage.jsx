import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  Calendar,
  FileText,
  AlertCircle,
  ChevronRight,
  Zap,
  Target,
  BarChart3,
  ArrowUpRight,
} from "lucide-react"

// Helper to calculate days until date
function getDaysUntil(dateStr) {
  if (!dateStr) return null
  const target = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}

// Format days text
function formatDaysText(days) {
  if (days === null) return "No date"
  if (days < 0) return `${Math.abs(days)} days overdue`
  if (days === 0) return "Due today"
  if (days === 1) return "1 day left"
  return `${days} days left`
}

// Get urgency color based on days
function getUrgencyColor(days) {
  if (days === null) return "slate"
  if (days < 0) return "rose"
  if (days <= 3) return "destructive"
  if (days <= 7) return "warning"
  return "info"
}

// KPI Card with colored icon background
function KPICard({ title, value, subtitle, icon: Icon, color = "blue", trend, trendColor = "emerald", secondaryValue, secondaryLabel, href }) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    rose: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
    indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400",
    cyan: "bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400",
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  }

  const trendColorClasses = {
    emerald: "text-emerald-500",
    amber: "text-amber-500",
    rose: "text-rose-500",
    blue: "text-blue-500",
  }

  const content = (
    <Card className="hover:shadow-lg transition-all duration-300 hover:border-primary/20 cursor-pointer group h-full">
      <CardContent className="p-6 h-full flex flex-col">
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          {href && (
            <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
        <div className="mt-4 flex-1">
          <div className="text-3xl font-bold">{value}</div>
          <div className="text-sm text-muted-foreground mt-1">{title}</div>
        </div>
        <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
          {secondaryValue !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{secondaryLabel}</span>
              <span className="text-sm font-semibold">{secondaryValue}</span>
            </div>
          )}
          {trend && (
            <div className="flex items-center gap-1">
              <TrendingUp className={`h-3 w-3 ${trendColorClasses[trendColor]}`} />
              <span className={`text-xs font-medium ${trendColorClasses[trendColor]}`}>{trend}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return href ? <Link to={href} className="block h-full">{content}</Link> : content
}

// Circular Progress Ring
function ProgressRing({ value, size = 80, strokeWidth = 8, color = "blue" }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  const colors = {
    blue: "stroke-blue-500",
    emerald: "stroke-emerald-500",
    amber: "stroke-amber-500",
    rose: "stroke-rose-500",
    purple: "stroke-purple-500",
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${colors[color]} transition-all duration-500`}
        />
      </svg>
      <span className="absolute text-lg font-bold">{value}%</span>
    </div>
  )
}

// Delivery Timeline Card
function DeliveryTimelineCard({ deployment }) {
  const days = getDaysUntil(deployment.targetDate)
  const isOverdue = days !== null && days < 0
  const isUrgent = days !== null && days >= 0 && days <= 7

  return (
    <Link to={`/deployments/${deployment.id}`}>
      <Card className={`min-w-[240px] hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 ${
        isOverdue ? "border-l-rose-500" : isUrgent ? "border-l-amber-500" : "border-l-blue-500"
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Calendar className="h-3 w-3" />
            {deployment.targetDate ? new Date(deployment.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No date"}
          </div>
          <div className="font-semibold text-sm line-clamp-1">{deployment.productName}</div>
          <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {deployment.clientName || "No client"}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Badge variant={getUrgencyColor(days)} className="text-xs">
              {formatDaysText(days)}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// Release Forecast Item
function ReleaseForecastItem({ deployment, category }) {
  const categoryColors = {
    thisWeek: "bg-rose-500",
    nextWeek: "bg-amber-500",
    thisMonth: "bg-blue-500",
  }

  return (
    <Link to={`/deployments/${deployment.id}`} className="block">
      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
        <div className={`w-2 h-2 rounded-full ${categoryColors[category]}`} />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {deployment.productName}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {deployment.clientName || "No client"}
          </div>
        </div>
        <Badge variant="outline" className="text-xs shrink-0 capitalize">
          {deployment.environment || "N/A"}
        </Badge>
      </div>
    </Link>
  )
}

// Deployment Health Card
function DeploymentHealthCard({ status, count, total, icon: Icon, color }) {
  const colorClasses = {
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
    rose: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
    emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
  }

  const percentage = total > 0 ? Math.round((count / total) * 100) : 0

  return (
    <div className={`flex flex-col items-center justify-center p-4 rounded-xl ${colorClasses[color]}`}>
      <Icon className="h-5 w-5 mb-2" />
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-xs font-medium uppercase tracking-wide">{status}</div>
      <div className="text-xs opacity-70 mt-1">{percentage}%</div>
    </div>
  )
}

// In Progress Item with overdue indicator
function InProgressItem({ deployment }) {
  const days = getDaysUntil(deployment.nextDeliveryDate || deployment.targetDate)
  const isOverdue = days !== null && days < 0

  return (
    <Link to={`/deployments/${deployment.id}`} className="block">
      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-2 h-2 rounded-full ${isOverdue ? "bg-rose-500 animate-pulse" : "bg-blue-500"}`} />
          <div className="min-w-0">
            <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
              {deployment.productName}
            </div>
            <div className="text-xs text-muted-foreground">
              {deployment.clientName}
            </div>
          </div>
        </div>
        {isOverdue && (
          <Badge variant="destructive-soft" className="text-xs shrink-0">
            {Math.abs(days)}d overdue
          </Badge>
        )}
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: () => reportsAPI.getDashboardMetrics(),
  })

  const { data: deployments } = useQuery({
    queryKey: ["all-deployments"],
    queryFn: () => deploymentsAPI.list({ pageSize: 100 }),
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

  const allDeployments = deployments?.rows || []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Calculate upcoming deployments (next 30 days) - use nextDeliveryDate field
  const upcomingDeployments = allDeployments
    .filter(d => d.nextDeliveryDate && d.status !== "Released")
    .map(d => ({ ...d, targetDate: d.nextDeliveryDate, days: getDaysUntil(d.nextDeliveryDate) }))
    .sort((a, b) => (a.days ?? 999) - (b.days ?? 999))

  // Delivery Timeline (next 30 days with dates)
  const timelineDeployments = upcomingDeployments.filter(d => d.days !== null && d.days >= -7 && d.days <= 30).slice(0, 8)

  // Release Forecast categorization
  const thisWeek = upcomingDeployments.filter(d => d.days !== null && d.days >= 0 && d.days <= 7)
  const nextWeek = upcomingDeployments.filter(d => d.days !== null && d.days > 7 && d.days <= 14)
  const thisMonth = upcomingDeployments.filter(d => d.days !== null && d.days > 14 && d.days <= 30)

  // In Progress deployments - status is "In Progress" from backend
  const inProgressDeployments = allDeployments.filter(d =>
    d.status === "In Progress"
  )
  const blockedDeployments = allDeployments.filter(d =>
    d.status === "Blocked"
  )
  const overdueDeployments = allDeployments.filter(d => {
    const days = getDaysUntil(d.nextDeliveryDate)
    return days !== null && days < 0 && d.status !== "Released"
  })

  // Status counts
  const statusCounts = {
    not_started: stats.deploymentsByStatus?.not_started || 0,
    in_progress: stats.deploymentsByStatus?.in_progress || 0,
    blocked: stats.deploymentsByStatus?.blocked || 0,
    completed: stats.deploymentsByStatus?.completed || 0,
  }
  const totalDeployments = Object.values(statusCounts).reduce((a, b) => a + b, 0)

  // Calculate average checklist progress
  const avgProgress = allDeployments.length > 0
    ? Math.round(allDeployments.reduce((acc, d) => acc + (d.checklistProgress || 0), 0) / allDeployments.length)
    : 0

  // Count unique clients with active deployments
  const activeClientIds = new Set(
    allDeployments
      .filter(d => d.status !== "Released")
      .map(d => d.clientId)
      .filter(Boolean)
  )
  const activeClientsCount = activeClientIds.size

  // On-time rate (completed within target date)
  const completedDeploymentsCount = allDeployments.filter(d => d.status === "Released").length
  const onTimeRate = completedDeploymentsCount > 0 ? 85 : 0 // Placeholder

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <Zap className="h-6 w-6" />
            </div>
            Command Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time delivery visibility and insights
          </p>
        </div>
        <Button asChild>
          <Link to="/deployments">
            <Rocket className="mr-2 h-4 w-4" />
            New Deployment
          </Link>
        </Button>
      </div>

      {/* Delivery Timeline */}
      {timelineDeployments.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">Delivery Timeline</h2>
            <Badge variant="secondary" className="ml-2">{timelineDeployments.length}</Badge>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
            {timelineDeployments.map(deployment => (
              <DeliveryTimelineCard key={deployment.id} deployment={deployment} />
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 items-stretch">
        <KPICard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          color="indigo"
          href="/products"
          secondaryLabel="EAP Products"
          secondaryValue={stats.eapProducts || 0}
        />
        <KPICard
          title="Total Clients"
          value={stats.totalClients}
          icon={Users}
          color="cyan"
          href="/clients"
          secondaryLabel="With Active Deployments"
          secondaryValue={activeClientsCount}
        />
        <KPICard
          title="Active Deployments"
          value={statusCounts.in_progress + statusCounts.not_started}
          icon={Rocket}
          color="blue"
          href="/deployments"
          secondaryLabel="In Progress / Not Started"
          secondaryValue={`${statusCounts.in_progress} / ${statusCounts.not_started}`}
        />
        <KPICard
          title="Completed"
          value={statusCounts.completed}
          icon={CheckCircle}
          color="emerald"
          secondaryLabel="Blocked"
          secondaryValue={statusCounts.blocked}
          trend={totalDeployments > 0 ? `${Math.round((statusCounts.completed / totalDeployments) * 100)}% completion rate` : undefined}
          trendColor="emerald"
        />
      </div>

      {/* Alert Cards */}
      {(overdueDeployments.length > 0 || blockedDeployments.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {overdueDeployments.length > 0 && (
            <Card className="border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900">
                    <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-rose-700 dark:text-rose-300">
                      {overdueDeployments.length} Overdue Deployment{overdueDeployments.length !== 1 ? "s" : ""}
                    </div>
                    <div className="text-sm text-rose-600 dark:text-rose-400">
                      Requires immediate attention
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {blockedDeployments.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-amber-700 dark:text-amber-300">
                      {blockedDeployments.length} Blocked Deployment{blockedDeployments.length !== 1 ? "s" : ""}
                    </div>
                    <div className="text-sm text-amber-600 dark:text-amber-400">
                      Waiting for resolution
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Release Forecast */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-muted-foreground" />
                Release Forecast
              </CardTitle>
              <Link to="/deployments" className="text-sm text-primary hover:underline">
                View All
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {thisWeek.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                    This Week ({thisWeek.length})
                  </span>
                </div>
                <div className="space-y-1">
                  {thisWeek.slice(0, 3).map(d => (
                    <ReleaseForecastItem key={d.id} deployment={d} category="thisWeek" />
                  ))}
                </div>
              </div>
            )}
            {nextWeek.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                    Next Week ({nextWeek.length})
                  </span>
                </div>
                <div className="space-y-1">
                  {nextWeek.slice(0, 3).map(d => (
                    <ReleaseForecastItem key={d.id} deployment={d} category="nextWeek" />
                  ))}
                </div>
              </div>
            )}
            {thisMonth.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                    This Month ({thisMonth.length})
                  </span>
                </div>
                <div className="space-y-1">
                  {thisMonth.slice(0, 3).map(d => (
                    <ReleaseForecastItem key={d.id} deployment={d} category="thisMonth" />
                  ))}
                </div>
              </div>
            )}
            {thisWeek.length === 0 && nextWeek.length === 0 && thisMonth.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No upcoming releases</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deployment Health */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              Deployment Health
            </CardTitle>
            <CardDescription>Status distribution overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <DeploymentHealthCard
                status="Not Started"
                count={statusCounts.not_started}
                total={totalDeployments}
                icon={Clock}
                color="slate"
              />
              <DeploymentHealthCard
                status="In Progress"
                count={statusCounts.in_progress}
                total={totalDeployments}
                icon={Activity}
                color="blue"
              />
              <DeploymentHealthCard
                status="Blocked"
                count={statusCounts.blocked}
                total={totalDeployments}
                icon={AlertTriangle}
                color="rose"
              />
              <DeploymentHealthCard
                status="Completed"
                count={statusCounts.completed}
                total={totalDeployments}
                icon={CheckCircle}
                color="emerald"
              />
            </div>

            {/* Progress Metrics */}
            <div className="mt-6 pt-6 border-t flex items-center justify-around">
              <div className="text-center">
                <ProgressRing value={avgProgress} color="blue" />
                <div className="text-xs text-muted-foreground mt-2">Avg. Checklist</div>
              </div>
              <div className="text-center">
                <ProgressRing value={onTimeRate} color="emerald" />
                <div className="text-xs text-muted-foreground mt-2">On-Time Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* In Progress - Upcoming */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                In Progress
              </CardTitle>
              <Badge variant="info">{inProgressDeployments.length}</Badge>
            </div>
            <CardDescription>Active deployments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {inProgressDeployments.slice(0, 6).map(deployment => (
                <InProgressItem key={deployment.id} deployment={deployment} />
              ))}
              {inProgressDeployments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Rocket className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active deployments</p>
                </div>
              )}
              {inProgressDeployments.length > 6 && (
                <Link
                  to="/deployments?status=in_progress"
                  className="flex items-center justify-center gap-1 text-sm text-primary hover:underline pt-2"
                >
                  +{inProgressDeployments.length - 6} more in progress
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
