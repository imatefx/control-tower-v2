import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { productsAPI, deploymentsAPI, clientsAPI } from "@/services/api"
import { formatDate } from "@/utils/dateFormat"
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
  FlaskConical,
  ExternalLink,
  Users,
  Rocket,
  TrendingUp,
  Calendar,
  Package,
  CheckCircle,
  Clock,
  AlertTriangle,
  PlayCircle,
  BarChart3,
  Link as LinkIcon,
  ArrowRight,
  Zap,
  Search,
  LayoutGrid,
  List,
  MoreHorizontal,
  Eye,
  ChevronRight,
} from "lucide-react"
import { useState } from "react"

// Status configuration
const statusConfig = {
  not_started: { color: "secondary", icon: Clock, label: "Not Started" },
  "Not Started": { color: "secondary", icon: Clock, label: "Not Started" },
  in_progress: { color: "info", icon: PlayCircle, label: "In Progress" },
  "In Progress": { color: "info", icon: PlayCircle, label: "In Progress" },
  blocked: { color: "destructive", icon: AlertTriangle, label: "Blocked" },
  "Blocked": { color: "destructive", icon: AlertTriangle, label: "Blocked" },
  completed: { color: "success", icon: CheckCircle, label: "Completed" },
  "Released": { color: "success", icon: CheckCircle, label: "Released" },
}

// EAP Product Card
function EAPProductCard({ product, deployments }) {
  const productDeployments = deployments?.filter(d => d.productId === product.id) || []
  const completed = productDeployments.filter(d => d.status === "completed" || d.status === "Released").length
  const inProgress = productDeployments.filter(d => d.status === "in_progress" || d.status === "In Progress").length
  const blocked = productDeployments.filter(d => d.status === "blocked" || d.status === "Blocked").length
  const notStarted = productDeployments.length - completed - inProgress - blocked
  const progressPercent = productDeployments.length > 0 ? Math.round((completed / productDeployments.length) * 100) : 0
  const clientCount = new Set(productDeployments.map(d => d.clientId)).size
  const eapInfo = product.eap || {}

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-purple-500 to-pink-500" />
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <Link to={`/products/${product.id}`} className="flex-1">
            <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-1">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {product.description || "No description"}
            </p>
          </Link>
          <Badge variant="purple" className="shrink-0 ml-2">EAP</Badge>
        </div>

        {/* EAP Timeline */}
        {(eapInfo.startDate || eapInfo.endDate) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Calendar className="h-4 w-4" />
            <span>
              {eapInfo.startDate && formatDate(eapInfo.startDate)}
              {eapInfo.startDate && eapInfo.endDate && " → "}
              {eapInfo.endDate && formatDate(eapInfo.endDate)}
            </span>
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Rocket className="h-4 w-4" />
            {productDeployments.length} deployments
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {clientCount} clients
          </span>
        </div>

        {/* Progress */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-medium">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Status breakdown */}
        <div className="grid grid-cols-4 gap-2 text-center mb-3">
          <div className="p-2 rounded bg-slate-50">
            <p className="text-lg font-bold text-slate-600">{notStarted}</p>
            <p className="text-[10px] text-slate-500">Not Started</p>
          </div>
          <div className="p-2 rounded bg-blue-50">
            <p className="text-lg font-bold text-blue-600">{inProgress}</p>
            <p className="text-[10px] text-blue-500">In Progress</p>
          </div>
          <div className="p-2 rounded bg-rose-50">
            <p className="text-lg font-bold text-rose-600">{blocked}</p>
            <p className="text-[10px] text-rose-500">Blocked</p>
          </div>
          <div className="p-2 rounded bg-emerald-50">
            <p className="text-lg font-bold text-emerald-600">{completed}</p>
            <p className="text-[10px] text-emerald-500">Completed</p>
          </div>
        </div>

        <Link
          to={`/products/${product.id}`}
          className="w-full text-center text-sm text-primary hover:underline font-medium flex items-center justify-center gap-1"
        >
          View Product
          <ChevronRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  )
}

export default function EAPDashboardPage() {
  const [search, setSearch] = useState("")
  const [view, setView] = useState("cards")

  const { data: eapProducts, isLoading: productsLoading } = useQuery({
    queryKey: ["products", "eap"],
    queryFn: () => productsAPI.getEAP(),
  })

  const { data: deployments, isLoading: deploymentsLoading } = useQuery({
    queryKey: ["deployments", "eap"],
    queryFn: async () => {
      const eapIds = eapProducts?.map((p) => p.id) || []
      if (eapIds.length === 0) return { rows: [] }
      return deploymentsAPI.list({ productIds: eapIds.join(",") })
    },
    enabled: !!eapProducts?.length,
  })

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: () => clientsAPI.list(),
  })

  const isLoading = productsLoading || deploymentsLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const allDeployments = deployments?.rows || []
  const totalEAPProducts = eapProducts?.length || 0
  const totalEAPDeployments = allDeployments.length
  const uniqueClientIds = new Set(allDeployments.map((d) => d.clientId))
  const uniqueClients = uniqueClientIds.size
  const completedEAP = allDeployments.filter(d => d.status === "completed" || d.status === "Released").length
  const inProgressEAP = allDeployments.filter(d => d.status === "in_progress" || d.status === "In Progress").length
  const blockedEAP = allDeployments.filter(d => d.status === "blocked" || d.status === "Blocked").length
  const completionRate = totalEAPDeployments > 0 ? Math.round((completedEAP / totalEAPDeployments) * 100) : 0

  // Filter products by search
  const filteredProducts = eapProducts?.filter(p =>
    search === "" || p.name?.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg text-white">
              <FlaskConical className="h-6 w-6" />
            </div>
            EAP Dashboard
          </h1>
          <p className="text-muted-foreground">
            Early Access Program overview and tracking
          </p>
        </div>
        <Badge variant="purple" className="text-sm px-3 py-1">
          <Zap className="h-3 w-3 mr-1" />
          {totalEAPProducts} Active Programs
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">EAP Products</p>
                <p className="text-2xl font-bold">{totalEAPProducts}</p>
                <p className="text-xs text-muted-foreground mt-1">Active programs</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Deployments</p>
                <p className="text-2xl font-bold">{totalEAPDeployments}</p>
                <p className="text-xs text-muted-foreground mt-1">Total EAP deployments</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Rocket className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-cyan-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clients</p>
                <p className="text-2xl font-bold">{uniqueClients}</p>
                <p className="text-xs text-muted-foreground mt-1">Participating clients</p>
              </div>
              <div className="p-3 bg-cyan-100 rounded-full">
                <Users className="h-5 w-5 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{inProgressEAP}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-rose-500">{blockedEAP} blocked</span>
                </div>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <PlayCircle className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedEAP}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">{completionRate}% rate</span>
                </div>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              Status Distribution
            </CardTitle>
            <CardDescription>EAP deployment status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "Not Started", count: totalEAPDeployments - completedEAP - inProgressEAP - blockedEAP, color: "bg-slate-500", icon: Clock },
                { label: "In Progress", count: inProgressEAP, color: "bg-blue-500", icon: PlayCircle },
                { label: "Blocked", count: blockedEAP, color: "bg-rose-500", icon: AlertTriangle },
                { label: "Completed", count: completedEAP, color: "bg-emerald-500", icon: CheckCircle },
              ].map(status => {
                const percent = totalEAPDeployments > 0 ? Math.round((status.count / totalEAPDeployments) * 100) : 0
                const StatusIcon = status.icon
                return (
                  <div key={status.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{status.label}</span>
                      </div>
                      <span className="font-medium">{status.count} ({percent}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${status.color} transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={352}
                    strokeDashoffset={352 - (352 * completionRate) / 100}
                    strokeLinecap="round"
                    className="text-emerald-500 transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{completionRate}%</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                {completedEAP} of {totalEAPDeployments} deployments completed
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 rounded-lg bg-purple-50 text-center">
                <p className="text-lg font-bold text-purple-600">
                  {totalEAPProducts > 0 ? (totalEAPDeployments / totalEAPProducts).toFixed(1) : 0}
                </p>
                <p className="text-xs text-purple-500">Avg per Product</p>
              </div>
              <div className="p-3 rounded-lg bg-cyan-50 text-center">
                <p className="text-lg font-bold text-cyan-600">
                  {uniqueClients > 0 ? (totalEAPDeployments / uniqueClients).toFixed(1) : 0}
                </p>
                <p className="text-xs text-cyan-500">Avg per Client</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* EAP Products */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                EAP Products
              </CardTitle>
              <CardDescription>Products in Early Access Program</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant={view === "cards" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setView("cards")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setView("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {view === "cards" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <EAPProductCard
                  key={product.id}
                  product={product}
                  deployments={allDeployments}
                />
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No EAP products found</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link to="/products">Browse Products</Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Deployments</TableHead>
                  <TableHead>Clients</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const productDeployments = allDeployments.filter(d => d.productId === product.id)
                  const completed = productDeployments.filter(d => d.status === "completed" || d.status === "Released").length
                  const inProgress = productDeployments.filter(d => d.status === "in_progress" || d.status === "In Progress").length
                  const blocked = productDeployments.filter(d => d.status === "blocked" || d.status === "Blocked").length
                  const progressPercent = productDeployments.length > 0 ? Math.round((completed / productDeployments.length) * 100) : 0
                  const clientCount = new Set(productDeployments.map(d => d.clientId)).size

                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Link
                          to={`/products/${product.id}`}
                          className="font-medium hover:text-primary hover:underline transition-colors"
                        >
                          {product.name}
                        </Link>
                      </TableCell>
                      <TableCell>{productDeployments.length}</TableCell>
                      <TableCell>{clientCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={progressPercent} className="h-2 w-20" />
                          <span className="text-sm text-muted-foreground">{progressPercent}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {inProgress > 0 && (
                            <Badge variant="info" className="text-xs">{inProgress} active</Badge>
                          )}
                          {blocked > 0 && (
                            <Badge variant="destructive" className="text-xs">{blocked} blocked</Badge>
                          )}
                          {completed > 0 && (
                            <Badge variant="success" className="text-xs">{completed} done</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/products/${product.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No EAP products found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent EAP Deployments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-muted-foreground" />
                Recent EAP Deployments
              </CardTitle>
              <CardDescription>Latest deployment activity</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/deployments">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Target Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allDeployments.slice(0, 5).map((deployment) => {
                const config = statusConfig[deployment.status] || statusConfig.not_started
                const StatusIcon = config.icon
                const isOverdue = deployment.nextDeliveryDate &&
                  new Date(deployment.nextDeliveryDate) < new Date() &&
                  deployment.status !== "completed" && deployment.status !== "Released"

                return (
                  <TableRow key={deployment.id}>
                    <TableCell>
                      <Link
                        to={`/products/${deployment.productId}`}
                        className="font-medium hover:text-primary hover:underline transition-colors"
                      >
                        {deployment.productName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/clients/${deployment.clientId}`}
                        className="hover:underline"
                      >
                        {deployment.clientName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {deployment.environment?.toUpperCase() || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.color} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {deployment.nextDeliveryDate ? (
                        <span className={isOverdue ? "text-rose-600 font-medium" : ""}>
                          {formatDate(deployment.nextDeliveryDate)}
                          {isOverdue && <AlertTriangle className="h-3 w-3 inline ml-1" />}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/deployments/${deployment.id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {allDeployments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No EAP deployments found
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
