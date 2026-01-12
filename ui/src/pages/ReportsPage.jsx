import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { reportsAPI, productsAPI, clientsAPI } from "@/services/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BarChart3,
  Loader2,
  Download,
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  Rocket,
  Calendar,
} from "lucide-react"

export default function ReportsPage() {
  const [productFilter, setProductFilter] = useState("all")
  const [clientFilter, setClientFilter] = useState("all")
  const [dateRange, setDateRange] = useState("30")

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["reports", "metrics", productFilter, clientFilter, dateRange],
    queryFn: () =>
      reportsAPI.getDashboardMetrics({
        productId: productFilter === "all" ? undefined : productFilter,
        clientId: clientFilter === "all" ? undefined : clientFilter,
        days: dateRange,
      }),
  })

  const { data: deploymentReport, isLoading: deploymentLoading } = useQuery({
    queryKey: ["reports", "deployments", productFilter, clientFilter],
    queryFn: () =>
      reportsAPI.getDeploymentReport({
        productId: productFilter === "all" ? undefined : productFilter,
        clientId: clientFilter === "all" ? undefined : clientFilter,
      }),
  })

  const { data: products } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => productsAPI.list({ pageSize: 100 }),
  })

  const { data: clients } = useQuery({
    queryKey: ["clients-all"],
    queryFn: () => clientsAPI.list({ pageSize: 100 }),
  })

  const isLoading = metricsLoading || deploymentLoading

  const handleExport = (type) => {
    // In a real app, this would trigger a download
    console.log(`Exporting ${type} report...`)
    alert(`Export ${type} report - This would trigger a download in production`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const stats = metrics?.data || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8" />
            Reports
          </h1>
          <p className="text-muted-foreground">
            Analytics and reporting dashboard
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport("csv")}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-40">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>

        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Products" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {products?.rows?.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients?.rows?.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.eapProducts || 0} in EAP
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Active clients</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              Deployments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDeployments || 0}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span className="text-xs text-emerald-500">
                {stats.completedDeployments || 0} completed
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalDeployments > 0
                ? Math.round((stats.completedDeployments / stats.totalDeployments) * 100)
                : 0}
              %
            </div>
            <Progress
              value={
                stats.totalDeployments > 0
                  ? (stats.completedDeployments / stats.totalDeployments) * 100
                  : 0
              }
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Deployment Status Breakdown</CardTitle>
            <CardDescription>Current status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.deploymentsByStatus || {}).map(([status, count]) => {
                const total = stats.totalDeployments || 1
                const percent = Math.round((count / total) * 100)
                const colors = {
                  not_started: "bg-gray-500",
                  in_progress: "bg-blue-500",
                  blocked: "bg-red-500",
                  completed: "bg-emerald-500",
                }
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize">{status.replace("_", " ")}</span>
                      <span className="font-medium">
                        {count} ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[status] || "bg-primary"}`}
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
            <CardTitle>Top Products by Deployments</CardTitle>
            <CardDescription>Most deployed products</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Deployments</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deploymentReport?.byProduct?.slice(0, 5).map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="text-right">{item.total}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="success">{item.completed}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!deploymentReport?.byProduct || deploymentReport.byProduct.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Activity</CardTitle>
          <CardDescription>Deployment activity by client</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">Total Deployments</TableHead>
                <TableHead className="text-right">In Progress</TableHead>
                <TableHead className="text-right">Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deploymentReport?.byClient?.map((item) => (
                <TableRow key={item.clientId}>
                  <TableCell className="font-medium">{item.clientName}</TableCell>
                  <TableCell>{item.region || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item.tier ? item.tier.charAt(0).toUpperCase() + item.tier.slice(1) : "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{item.total}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="info">{item.inProgress}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="success">{item.completed}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {(!deploymentReport?.byClient || deploymentReport.byClient.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No data available
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
