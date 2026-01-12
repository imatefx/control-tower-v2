import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { productsAPI, deploymentsAPI, clientsAPI } from "@/services/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
} from "lucide-react"

// Circular progress ring component
function ProgressRing({ value, size = 60, strokeWidth = 6, color = "emerald" }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference
  const colorMap = {
    emerald: "stroke-emerald-500",
    blue: "stroke-blue-500",
    purple: "stroke-purple-500",
    amber: "stroke-amber-500",
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="stroke-slate-200"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${colorMap[color]} transition-all duration-500`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold">{value}%</span>
      </div>
    </div>
  )
}

export default function EAPDashboardPage() {
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
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  const totalEAPProducts = eapProducts?.length || 0
  const totalEAPDeployments = deployments?.rows?.length || 0
  const uniqueClientIds = new Set(deployments?.rows?.map((d) => d.clientId))
  const uniqueClients = uniqueClientIds.size
  const completedEAP = deployments?.rows?.filter((d) =>
    d.status === "completed" || d.status === "Released"
  ).length || 0
  const inProgressEAP = deployments?.rows?.filter((d) =>
    d.status === "in_progress" || d.status === "In Progress"
  ).length || 0
  const blockedEAP = deployments?.rows?.filter((d) =>
    d.status === "blocked" || d.status === "Blocked"
  ).length || 0

  const statusColors = {
    not_started: "secondary",
    "Not Started": "secondary",
    in_progress: "info",
    "In Progress": "info",
    blocked: "destructive",
    "Blocked": "destructive",
    completed: "success",
    "Released": "success",
  }

  const statusIcons = {
    not_started: Clock,
    "Not Started": Clock,
    in_progress: PlayCircle,
    "In Progress": PlayCircle,
    blocked: AlertTriangle,
    "Blocked": AlertTriangle,
    completed: CheckCircle,
    "Released": CheckCircle,
  }

  // Get participating clients with their EAP counts
  const clientEAPStats = [...uniqueClientIds].map(clientId => {
    const client = clients?.rows?.find(c => c.id === clientId) ||
                   deployments?.rows?.find(d => d.clientId === clientId)
    const clientDeployments = deployments?.rows?.filter(d => d.clientId === clientId) || []
    const completed = clientDeployments.filter(d => d.status === "completed" || d.status === "Released").length
    return {
      id: clientId,
      name: client?.clientName || client?.name || "Unknown",
      deployments: clientDeployments.length,
      completed,
      products: [...new Set(clientDeployments.map(d => d.productId))].length,
    }
  }).sort((a, b) => b.deployments - a.deployments)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600">
          <FlaskConical className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">EAP Dashboard</h1>
          <p className="text-muted-foreground">
            Early Access Program overview and tracking
          </p>
        </div>
        <Badge variant="purple" className="ml-auto text-sm px-3 py-1">
          <Zap className="h-3 w-3 mr-1" />
          {totalEAPProducts} Active Programs
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-purple-600 font-medium">EAP Products</p>
                <p className="text-2xl font-bold text-purple-900">{totalEAPProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500">
                <Rocket className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">Total Deployments</p>
                <p className="text-2xl font-bold text-blue-900">{totalEAPDeployments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-50 to-sky-50 border-cyan-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-cyan-600 font-medium">Participating Clients</p>
                <p className="text-2xl font-bold text-cyan-900">{uniqueClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500">
                <PlayCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-amber-600 font-medium">In Progress</p>
                <p className="text-2xl font-bold text-amber-900">{inProgressEAP}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-emerald-600 font-medium">Completed</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-emerald-900">{completedEAP}</p>
                  {totalEAPDeployments > 0 && (
                    <Badge variant="success" className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {Math.round((completedEAP / totalEAPDeployments) * 100)}%
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" />
            EAP Products
          </TabsTrigger>
          <TabsTrigger value="deployments" className="gap-2">
            <Rocket className="h-4 w-4" />
            Deployments
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-2">
            <Users className="h-4 w-4" />
            Clients
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products">
          {eapProducts && eapProducts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {eapProducts.map((product) => {
                const productDeployments = deployments?.rows?.filter(
                  (d) => d.productId === product.id
                ) || []
                const completed = productDeployments.filter(
                  (d) => d.status === "completed" || d.status === "Released"
                ).length
                const inProgress = productDeployments.filter(
                  (d) => d.status === "in_progress" || d.status === "In Progress"
                ).length
                const blocked = productDeployments.filter(
                  (d) => d.status === "blocked" || d.status === "Blocked"
                ).length
                const progressPercent =
                  productDeployments.length > 0
                    ? Math.round((completed / productDeployments.length) * 100)
                    : 0
                const eapInfo = product.eap || {}
                const clientCount = new Set(productDeployments.map(d => d.clientId)).size

                return (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link
                            to={`/products/${product.id}`}
                            className="font-semibold text-lg hover:underline"
                          >
                            {product.name}
                          </Link>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {product.description || "No description"}
                          </p>
                        </div>
                        <Badge variant="purple" className="shrink-0">EAP</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* EAP Timeline */}
                      {(eapInfo.startDate || eapInfo.endDate) && (
                        <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-purple-500" />
                            <span className="text-purple-700">
                              {eapInfo.startDate && new Date(eapInfo.startDate).toLocaleDateString()}
                              {eapInfo.startDate && eapInfo.endDate && " → "}
                              {eapInfo.endDate && new Date(eapInfo.endDate).toLocaleDateString()}
                            </span>
                          </div>
                          {eapInfo.jiraBoardUrl && (
                            <a
                              href={eapInfo.jiraBoardUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 mt-1"
                            >
                              <LinkIcon className="h-3 w-3" />
                              Jira Board
                            </a>
                          )}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Rocket className="h-4 w-4" />
                            {productDeployments.length}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            {clientCount}
                          </span>
                        </div>
                        <ProgressRing value={progressPercent} size={50} strokeWidth={5} color="purple" />
                      </div>

                      {/* Status breakdown */}
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="p-2 rounded bg-slate-50">
                          <p className="text-lg font-bold text-slate-600">{productDeployments.length - completed - inProgress - blocked}</p>
                          <p className="text-[10px] text-slate-400">Not Started</p>
                        </div>
                        <div className="p-2 rounded bg-blue-50">
                          <p className="text-lg font-bold text-blue-600">{inProgress}</p>
                          <p className="text-[10px] text-blue-400">In Progress</p>
                        </div>
                        <div className="p-2 rounded bg-rose-50">
                          <p className="text-lg font-bold text-rose-600">{blocked}</p>
                          <p className="text-[10px] text-rose-400">Blocked</p>
                        </div>
                        <div className="p-2 rounded bg-emerald-50">
                          <p className="text-lg font-bold text-emerald-600">{completed}</p>
                          <p className="text-[10px] text-emerald-400">Completed</p>
                        </div>
                      </div>

                      {/* View details */}
                      <Button variant="outline" className="w-full" asChild>
                        <Link to={`/products/${product.id}`}>
                          View Product
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FlaskConical className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground">No EAP products found</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link to="/products">Browse Products</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Deployments Tab */}
        <TabsContent value="deployments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-blue-500" />
                EAP Deployments
              </CardTitle>
              <CardDescription>All deployments for EAP products</CardDescription>
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
                  {deployments?.rows?.map((deployment) => {
                    const StatusIcon = statusIcons[deployment.status] || Clock
                    const isOverdue = deployment.nextDeliveryDate &&
                      new Date(deployment.nextDeliveryDate) < new Date() &&
                      deployment.status !== "completed" && deployment.status !== "Released"
                    return (
                      <TableRow key={deployment.id}>
                        <TableCell>
                          <Link
                            to={`/products/${deployment.productId}`}
                            className="font-medium hover:underline"
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
                          <Badge variant={statusColors[deployment.status]} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {deployment.status?.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {deployment.nextDeliveryDate ? (
                            <span className={isOverdue ? "text-rose-600 font-medium" : ""}>
                              {new Date(deployment.nextDeliveryDate).toLocaleDateString()}
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
                  {(!deployments?.rows || deployments.rows.length === 0) && (
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
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan-500" />
                Participating Clients
              </CardTitle>
              <CardDescription>Clients enrolled in Early Access Programs</CardDescription>
            </CardHeader>
            <CardContent>
              {clientEAPStats.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {clientEAPStats.map((client) => {
                    const progressPercent = client.deployments > 0
                      ? Math.round((client.completed / client.deployments) * 100)
                      : 0
                    return (
                      <div
                        key={client.id}
                        className="p-4 rounded-lg border bg-gradient-to-br from-slate-50 to-white hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Link
                            to={`/clients/${client.id}`}
                            className="font-semibold hover:underline"
                          >
                            {client.name}
                          </Link>
                          <ProgressRing value={progressPercent} size={40} strokeWidth={4} color="blue" />
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 rounded bg-purple-50">
                            <p className="text-lg font-bold text-purple-600">{client.products}</p>
                            <p className="text-[10px] text-purple-400">Products</p>
                          </div>
                          <div className="p-2 rounded bg-blue-50">
                            <p className="text-lg font-bold text-blue-600">{client.deployments}</p>
                            <p className="text-[10px] text-blue-400">Deployments</p>
                          </div>
                          <div className="p-2 rounded bg-emerald-50">
                            <p className="text-lg font-bold text-emerald-600">{client.completed}</p>
                            <p className="text-[10px] text-emerald-400">Completed</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No clients participating in EAP</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-500" />
                  Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Not Started */}
                  {(() => {
                    const count = totalEAPDeployments - completedEAP - inProgressEAP - blockedEAP
                    const percent = totalEAPDeployments > 0 ? Math.round((count / totalEAPDeployments) * 100) : 0
                    return (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Not Started</span>
                          <span className="text-muted-foreground">{count} ({percent}%)</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-500 transition-all duration-500" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    )
                  })()}
                  {/* In Progress */}
                  {(() => {
                    const percent = totalEAPDeployments > 0 ? Math.round((inProgressEAP / totalEAPDeployments) * 100) : 0
                    return (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">In Progress</span>
                          <span className="text-muted-foreground">{inProgressEAP} ({percent}%)</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    )
                  })()}
                  {/* Blocked */}
                  {(() => {
                    const percent = totalEAPDeployments > 0 ? Math.round((blockedEAP / totalEAPDeployments) * 100) : 0
                    return (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Blocked</span>
                          <span className="text-muted-foreground">{blockedEAP} ({percent}%)</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    )
                  })()}
                  {/* Completed */}
                  {(() => {
                    const percent = totalEAPDeployments > 0 ? Math.round((completedEAP / totalEAPDeployments) * 100) : 0
                    return (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Completed</span>
                          <span className="text-muted-foreground">{completedEAP} ({percent}%)</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Overall Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  Overall EAP Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <ProgressRing
                      value={totalEAPDeployments > 0 ? Math.round((completedEAP / totalEAPDeployments) * 100) : 0}
                      size={120}
                      strokeWidth={10}
                      color="emerald"
                    />
                    <p className="mt-4 text-sm text-muted-foreground">
                      {completedEAP} of {totalEAPDeployments} deployments completed
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                    <p className="text-sm text-amber-600 font-medium">Avg. per Product</p>
                    <p className="text-2xl font-bold text-amber-900">
                      {totalEAPProducts > 0 ? (totalEAPDeployments / totalEAPProducts).toFixed(1) : 0}
                    </p>
                    <p className="text-xs text-amber-500">deployments</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-50 to-sky-50 border border-cyan-100">
                    <p className="text-sm text-cyan-600 font-medium">Avg. per Client</p>
                    <p className="text-2xl font-bold text-cyan-900">
                      {uniqueClients > 0 ? (totalEAPDeployments / uniqueClients).toFixed(1) : 0}
                    </p>
                    <p className="text-xs text-cyan-500">deployments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
