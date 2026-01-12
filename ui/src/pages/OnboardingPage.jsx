import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { deploymentsAPI } from "@/services/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Loader2,
  ExternalLink,
  ClipboardList,
  AlertTriangle,
  Search,
  LayoutGrid,
  List,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  Circle,
  Package,
  Users,
  Calendar,
  ChevronRight,
  Play,
  Pause,
} from "lucide-react"

// Onboarding Card Component
function OnboardingCard({ deployment }) {
  const getStatusConfig = (status) => {
    switch (status) {
      case "Not Started":
        return { color: "bg-slate-500", icon: Circle, bgLight: "bg-slate-50", textColor: "text-slate-700" }
      case "In Progress":
        return { color: "bg-blue-500", icon: Play, bgLight: "bg-blue-50", textColor: "text-blue-700" }
      case "Blocked":
        return { color: "bg-red-500", icon: Pause, bgLight: "bg-red-50", textColor: "text-red-700" }
      default:
        return { color: "bg-gray-500", icon: Circle, bgLight: "bg-gray-50", textColor: "text-gray-700" }
    }
  }

  const config = getStatusConfig(deployment.status)
  const StatusIcon = config.icon
  const progress = deployment.checklistProgress || 0

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
      <div className={`h-1.5 ${deployment.status === "Blocked" ? "bg-gradient-to-r from-red-500 to-rose-500" : "bg-gradient-to-r from-blue-500 to-indigo-500"}`} />
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <Link to={`/deployments/${deployment.id}`} className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-lg ${config.bgLight}`}>
                <Package className={`h-4 w-4 ${config.textColor}`} />
              </div>
              <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-1">
                {deployment.productName}
              </h3>
            </div>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/deployments/${deployment.id}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Users className="h-4 w-4" />
          <span className="truncate">{deployment.clientName || "No client"}</span>
        </div>

        {/* Status Badge */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgLight} ${config.textColor}`}>
            <StatusIcon className="h-3 w-3" />
            {deployment.status}
          </div>
          {deployment.environment && (
            <Badge variant="outline" className="text-xs capitalize">
              {deployment.environment}
            </Badge>
          )}
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Checklist Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Delivery Date */}
        {deployment.nextDeliveryDate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Calendar className="h-3 w-3" />
            <span>Due: {new Date(deployment.nextDeliveryDate).toLocaleDateString()}</span>
          </div>
        )}

        {/* Blocked Reason */}
        {deployment.status === "Blocked" && deployment.blockedComment && (
          <div className="p-2 bg-red-50 rounded-lg text-xs text-red-700 mb-3">
            <AlertTriangle className="h-3 w-3 inline mr-1" />
            {deployment.blockedComment}
          </div>
        )}

        <Link
          to={`/deployments/${deployment.id}`}
          className="mt-2 flex items-center justify-center gap-1 w-full py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
        >
          View Details
          <ChevronRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  )
}

export default function OnboardingPage() {
  const [search, setSearch] = useState("")
  const [view, setView] = useState("cards")

  const { data: deployments, isLoading } = useQuery({
    queryKey: ["deployments", "onboarding"],
    queryFn: () => deploymentsAPI.list({}),
  })

  const allDeployments = deployments?.rows || []

  const onboardingDeployments = allDeployments.filter(
    (d) => d.status === "Not Started" || d.status === "In Progress"
  ).filter(d =>
    !search ||
    d.productName?.toLowerCase().includes(search.toLowerCase()) ||
    d.clientName?.toLowerCase().includes(search.toLowerCase())
  )

  const blockedDeployments = allDeployments.filter(
    (d) => d.status === "Blocked"
  )

  const notStartedCount = allDeployments.filter(d => d.status === "Not Started").length
  const inProgressCount = allDeployments.filter(d => d.status === "In Progress").length
  const blockedCount = blockedDeployments.length

  const statusColors = {
    "Not Started": "secondary",
    "In Progress": "info",
    "Blocked": "destructive",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
              <ClipboardList className="h-6 w-6" />
            </div>
            Onboarding
          </h1>
          <p className="text-muted-foreground mt-1">Track and manage client onboarding progress</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-slate-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Circle className="h-4 w-4 text-slate-500" />
              Not Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notStartedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting kickoff</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Play className="h-4 w-4 text-blue-500" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently active</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Blocked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{blockedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Total Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{notStartedCount + inProgressCount}</div>
            <p className="text-xs text-muted-foreground mt-1">All onboarding</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and View Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search onboarding..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <Button
            variant={view === "cards" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("cards")}
            className="gap-2"
          >
            <LayoutGrid className="h-4 w-4" />
            Cards
          </Button>
          <Button
            variant={view === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("list")}
            className="gap-2"
          >
            <List className="h-4 w-4" />
            List
          </Button>
        </div>
      </div>

      {/* Blocked Deployments Alert */}
      {blockedDeployments.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Blocked Deployments
            </CardTitle>
            <CardDescription className="text-red-600/80">
              These deployments require immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {blockedDeployments.map((deployment) => (
                <div
                  key={deployment.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-100"
                >
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="font-medium">{deployment.productName}</p>
                      <p className="text-sm text-muted-foreground">{deployment.clientName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-red-600 max-w-xs truncate">
                      {deployment.blockedComment || "No reason provided"}
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/deployments/${deployment.id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : view === "cards" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {onboardingDeployments.map((deployment) => (
            <OnboardingCard key={deployment.id} deployment={deployment} />
          ))}
          {onboardingDeployments.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No active onboarding deployments</p>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Active Onboarding</CardTitle>
            <CardDescription>Deployments currently being onboarded</CardDescription>
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
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {onboardingDeployments.map((deployment) => (
                  <TableRow key={deployment.id}>
                    <TableCell>
                      <Link
                        to={`/deployments/${deployment.id}`}
                        className="flex items-center gap-2 hover:text-primary"
                      >
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{deployment.productName}</span>
                      </Link>
                    </TableCell>
                    <TableCell>{deployment.clientName}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[deployment.status]}>
                        {deployment.status}
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
                      <Badge variant="outline" className="capitalize">
                        {deployment.environment || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {deployment.nextDeliveryDate
                        ? new Date(deployment.nextDeliveryDate).toLocaleDateString()
                        : "-"}
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
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No active onboarding deployments
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
