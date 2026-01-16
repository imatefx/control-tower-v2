import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { deploymentsAPI, productsAPI } from "@/services/api"
import { formatDate } from "@/utils/dateFormat"
import {
  Rocket,
  Calendar,
  Package,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  Target,
  Zap,
  Building,
  FlaskConical,
  CalendarDays,
  Loader2,
  ArrowUpRight,
  BarChart3,
  Activity,
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

// Get week number
function getWeekNumber(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

// Group deployments by week
function groupByWeek(deployments) {
  const grouped = {}
  deployments.forEach(d => {
    const date = d.nextDeliveryDate || d.targetDate
    if (!date) return
    const weekNum = getWeekNumber(date)
    const year = new Date(date).getFullYear()
    const key = `${year}-W${weekNum}`
    if (!grouped[key]) {
      grouped[key] = {
        weekKey: key,
        weekNum,
        year,
        startDate: getWeekStartDate(new Date(date)),
        deployments: []
      }
    }
    grouped[key].deployments.push(d)
  })
  return Object.values(grouped).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    return a.weekNum - b.weekNum
  })
}

// Get the start date (Monday) of a week
function getWeekStartDate(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

// Format week range
function formatWeekRange(startDate) {
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 6)
  const options = { month: 'short', day: 'numeric' }
  return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`
}

// KPI Summary Card
function SummaryCard({ title, value, subtitle, icon: Icon, color, href }) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    emerald: "from-emerald-500 to-emerald-600",
    purple: "from-purple-500 to-purple-600",
    amber: "from-amber-500 to-amber-600",
    rose: "from-rose-500 to-rose-600",
    indigo: "from-indigo-500 to-indigo-600",
  }

  const content = (
    <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 group border-0">
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-90`} />
      <CardContent className="relative p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium">{title}</p>
            <p className="text-4xl font-bold mt-2">{value}</p>
            {subtitle && <p className="text-white/70 text-sm mt-1">{subtitle}</p>}
          </div>
          <div className="p-4 bg-white/20 rounded-2xl">
            <Icon className="h-8 w-8" />
          </div>
        </div>
        {href && (
          <div className="mt-4 flex items-center text-white/80 text-sm group-hover:text-white transition-colors">
            <span>View details</span>
            <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </CardContent>
    </Card>
  )

  return href ? <Link to={href} className="block">{content}</Link> : content
}

// Release Card Component
function ReleaseCard({ deployment }) {
  const targetDate = deployment.nextDeliveryDate || deployment.targetDate
  const days = getDaysUntil(targetDate)
  const isOverdue = days !== null && days < 0
  const isUrgent = days !== null && days >= 0 && days <= 3
  const isThisWeek = days !== null && days >= 0 && days <= 7

  const typeConfig = {
    ga: { color: "emerald", icon: Rocket, label: "GA Release" },
    eap: { color: "purple", icon: FlaskConical, label: "EAP" },
    "feature-release": { color: "blue", icon: Zap, label: "Feature" },
    "client-specific": { color: "amber", icon: Building, label: "Client Specific" },
  }

  const config = typeConfig[deployment.deploymentType] || typeConfig.ga
  const TypeIcon = config.icon

  const statusColors = {
    "Not Started": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    "In Progress": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    "Blocked": "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
    "Released": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  }

  const gradientColors = {
    emerald: "from-emerald-500 to-green-500",
    purple: "from-purple-500 to-pink-500",
    blue: "from-blue-500 to-indigo-500",
    amber: "from-amber-500 to-orange-500",
  }

  return (
    <Link to={`/deployments/${deployment.id}`}>
      <Card className={`group hover:shadow-lg transition-all duration-300 overflow-hidden ${
        isOverdue ? "ring-2 ring-rose-500/50" : isUrgent ? "ring-2 ring-amber-500/50" : ""
      }`}>
        <div className={`h-1.5 bg-gradient-to-r ${gradientColors[config.color]}`} />
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradientColors[config.color]} text-white`}>
                <TypeIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                  {deployment.productName}
                </h3>
                <p className="text-sm text-muted-foreground">{config.label}</p>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Client */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Users className="h-4 w-4" />
            <span>{deployment.clientName || "All Clients"}</span>
          </div>

          {/* Status and Environment */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[deployment.status] || statusColors["Not Started"]}`}>
              {deployment.status || "Not Started"}
            </span>
            <Badge variant="outline" className="text-xs">
              {deployment.environment === "qa" ? "QA" : deployment.environment?.charAt(0).toUpperCase() + deployment.environment?.slice(1) || "Production"}
            </Badge>
          </div>

          {/* Progress */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Checklist Progress</span>
              <span className="font-semibold">{deployment.checklistProgress || 0}%</span>
            </div>
            <Progress value={deployment.checklistProgress || 0} className="h-2" />
          </div>

          {/* Target Date */}
          <div className={`flex items-center justify-between p-3 rounded-lg ${
            isOverdue ? "bg-rose-50 dark:bg-rose-950/30" :
            isUrgent ? "bg-amber-50 dark:bg-amber-950/30" :
            isThisWeek ? "bg-blue-50 dark:bg-blue-950/30" :
            "bg-slate-50 dark:bg-slate-800/50"
          }`}>
            <div className="flex items-center gap-2">
              <Calendar className={`h-4 w-4 ${
                isOverdue ? "text-rose-500" : isUrgent ? "text-amber-500" : isThisWeek ? "text-blue-500" : "text-slate-500"
              }`} />
              <span className={`text-sm font-medium ${
                isOverdue ? "text-rose-700 dark:text-rose-400" :
                isUrgent ? "text-amber-700 dark:text-amber-400" :
                isThisWeek ? "text-blue-700 dark:text-blue-400" : ""
              }`}>
                {targetDate ? formatDate(targetDate) : "No date set"}
              </span>
            </div>
            {days !== null && (
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                isOverdue ? "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300" :
                isUrgent ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" :
                isThisWeek ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
                "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}>
                {isOverdue ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `${days}d`}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// Timeline Week Section
function WeekSection({ week, isCurrentWeek }) {
  return (
    <div className="relative">
      {/* Week Header */}
      <div className={`sticky top-0 z-10 py-3 px-4 mb-4 rounded-xl ${
        isCurrentWeek
          ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
          : "bg-slate-100 dark:bg-slate-800"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5" />
            <div>
              <span className="font-semibold">Week {week.weekNum}</span>
              <span className={`ml-2 text-sm ${isCurrentWeek ? "text-white/80" : "text-muted-foreground"}`}>
                {formatWeekRange(week.startDate)}
              </span>
            </div>
          </div>
          <Badge variant={isCurrentWeek ? "secondary" : "outline"} className={isCurrentWeek ? "bg-white/20 text-white border-0" : ""}>
            {week.deployments.length} release{week.deployments.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {/* Releases Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {week.deployments
          .sort((a, b) => {
            const dateA = new Date(a.nextDeliveryDate || a.targetDate)
            const dateB = new Date(b.nextDeliveryDate || b.targetDate)
            return dateA - dateB
          })
          .map((deployment) => (
            <ReleaseCard key={deployment.id} deployment={deployment} />
          ))}
      </div>
    </div>
  )
}

export default function ShareholderDashboardPage() {
  // Fetch deployments with upcoming releases
  const { data: deployments, isLoading } = useQuery({
    queryKey: ["deployments-shareholder"],
    queryFn: () => deploymentsAPI.list({ pageSize: 200 }),
    refetchInterval: 60000, // Refresh every minute
  })

  // Fetch products for additional context
  const { data: products } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => productsAPI.list({ pageSize: 100 }),
  })

  // Filter and process deployments
  const upcomingDeployments = (deployments?.rows || [])
    .filter(d => {
      if (d.status === "Released") return false
      const targetDate = d.nextDeliveryDate || d.targetDate
      if (!targetDate) return false
      return true
    })
    .sort((a, b) => {
      const dateA = new Date(a.nextDeliveryDate || a.targetDate)
      const dateB = new Date(b.nextDeliveryDate || b.targetDate)
      return dateA - dateB
    })

  // Calculate stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const stats = {
    total: upcomingDeployments.length,
    thisWeek: upcomingDeployments.filter(d => {
      const days = getDaysUntil(d.nextDeliveryDate || d.targetDate)
      return days !== null && days >= 0 && days <= 7
    }).length,
    overdue: upcomingDeployments.filter(d => {
      const days = getDaysUntil(d.nextDeliveryDate || d.targetDate)
      return days !== null && days < 0
    }).length,
    inProgress: upcomingDeployments.filter(d => d.status === "In Progress").length,
    blocked: upcomingDeployments.filter(d => d.status === "Blocked").length,
    avgProgress: upcomingDeployments.length > 0
      ? Math.round(upcomingDeployments.reduce((sum, d) => sum + (d.checklistProgress || 0), 0) / upcomingDeployments.length)
      : 0,
  }

  // Group by week
  const weeklyGroups = groupByWeek(upcomingDeployments)
  const currentWeekNum = getWeekNumber(today)
  const currentYear = today.getFullYear()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <BarChart3 className="h-6 w-6" />
          </div>
          Shareholder Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Overview of upcoming product releases and deployment status
        </p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <SummaryCard
          title="Total Upcoming"
          value={stats.total}
          subtitle="Active releases"
          icon={Rocket}
          color="indigo"
          href="/deployments"
        />
        <SummaryCard
          title="This Week"
          value={stats.thisWeek}
          subtitle="Releases due"
          icon={Calendar}
          color="blue"
        />
        <SummaryCard
          title="In Progress"
          value={stats.inProgress}
          subtitle="Currently active"
          icon={Activity}
          color="emerald"
        />
        <SummaryCard
          title="Overdue"
          value={stats.overdue}
          subtitle="Need attention"
          icon={AlertTriangle}
          color="rose"
        />
        <SummaryCard
          title="Blocked"
          value={stats.blocked}
          subtitle="Requires action"
          icon={Clock}
          color="amber"
        />
        <SummaryCard
          title="Avg Progress"
          value={`${stats.avgProgress}%`}
          subtitle="Checklist completion"
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Quick Stats Bar */}
      <Card className="border-0 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-muted-foreground">GA Releases</span>
                <span className="font-semibold">{upcomingDeployments.filter(d => d.deploymentType === "ga").length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-sm text-muted-foreground">EAP</span>
                <span className="font-semibold">{upcomingDeployments.filter(d => d.deploymentType === "eap").length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-muted-foreground">Features</span>
                <span className="font-semibold">{upcomingDeployments.filter(d => d.deploymentType === "feature-release").length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm text-muted-foreground">Client Specific</span>
                <span className="font-semibold">{upcomingDeployments.filter(d => d.deploymentType === "client-specific").length}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              <span>Total Products: {new Set(upcomingDeployments.map(d => d.productId)).size}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline by Week */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Release Timeline</h2>
        </div>

        {weeklyGroups.length > 0 ? (
          <div className="space-y-8">
            {weeklyGroups.map((week) => (
              <WeekSection
                key={week.weekKey}
                week={week}
                isCurrentWeek={week.weekNum === currentWeekNum && week.year === currentYear}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <CheckCircle className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground">
                No upcoming releases scheduled. Check back later for new deployments.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
