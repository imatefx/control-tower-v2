import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { reportsAPI } from "@/services/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Grid3X3,
  Users,
  Package,
  Rocket,
  ChevronDown,
  ChevronRight,
  Search,
  Loader2,
  FlaskConical,
  AlertTriangle,
  CheckCircle,
  Clock,
  PlayCircle,
} from "lucide-react"

const statusColors = {
  notStarted: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  inProgress: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  blocked: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  released: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
}

const StatusBadge = ({ count, type, icon: Icon }) => {
  if (count === 0) return null
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[type]}`}>
      <Icon className="h-3 w-3" />
      {count}
    </span>
  )
}

export default function ClientProductOverviewPage() {
  const [view, setView] = useState("byClient") // "byClient" | "byProduct"
  const [search, setSearch] = useState("")
  const [expandedRows, setExpandedRows] = useState(new Set())

  const { data, isLoading, error } = useQuery({
    queryKey: ["client-product-overview"],
    queryFn: reportsAPI.getClientProductOverview,
  })

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const expandAll = () => {
    const items = view === "byClient" ? data?.byClient : data?.byProduct
    if (items) {
      setExpandedRows(new Set(items.map(item => view === "byClient" ? item.clientId : item.productId)))
    }
  }

  const collapseAll = () => {
    setExpandedRows(new Set())
  }

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!data) return { byClient: [], byProduct: [] }

    const searchLower = search.toLowerCase()

    const filteredByClient = data.byClient.filter(client =>
      client.clientName.toLowerCase().includes(searchLower) ||
      client.products.some(p => p.productName.toLowerCase().includes(searchLower))
    )

    const filteredByProduct = data.byProduct.filter(product =>
      product.productName.toLowerCase().includes(searchLower) ||
      product.clients.some(c => c.clientName.toLowerCase().includes(searchLower))
    )

    return { byClient: filteredByClient, byProduct: filteredByProduct }
  }, [data, search])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Failed to load data</p>
      </div>
    )
  }

  const summary = data?.summary || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Grid3X3 className="h-8 w-8" />
            Client Product Overview
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive view of client-product relationships and deployment status
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.clientsWithProducts || 0}</p>
                <p className="text-xs text-muted-foreground">Clients with Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
                <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.productsWithClients || 0}</p>
                <p className="text-xs text-muted-foreground">Products with Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900">
                <Rocket className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.totalDeployments || 0}</p>
                <p className="text-xs text-muted-foreground">Total Deployments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.blockedDeployments || 0}</p>
                <p className="text-xs text-muted-foreground">Blocked</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search clients or products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={view === "byClient" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setView("byClient")}
            >
              <Users className="h-4 w-4 mr-1" />
              By Client
            </Button>
            <Button
              variant={view === "byProduct" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setView("byProduct")}
            >
              <Package className="h-4 w-4 mr-1" />
              By Product
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {view === "byClient" ? "Clients and Their Products" : "Products and Their Clients"}
          </CardTitle>
          <CardDescription>
            {view === "byClient"
              ? "View each client's onboarded products and deployment status"
              : "View each product's client base and deployment status"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {view === "byClient" ? (
            <div className="space-y-2">
              {filteredData.byClient.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {search ? "No clients match your search" : "No clients with products found"}
                </div>
              ) : (
                filteredData.byClient.map((client) => (
                  <Collapsible
                    key={client.clientId}
                    open={expandedRows.has(client.clientId)}
                    onOpenChange={() => toggleRow(client.clientId)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          {expandedRows.has(client.clientId) ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <Link
                              to={`/clients/${client.clientId}`}
                              className="font-medium hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {client.clientName}
                            </Link>
                            {client.cdgOwner && (
                              <p className="text-xs text-muted-foreground">Owner: {client.cdgOwner}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline">{client.productCount} products</Badge>
                          <Badge variant="secondary">{client.totalDeployments} deployments</Badge>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-8 mr-4 mb-2 mt-1 border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead className="text-center">Deployments</TableHead>
                              <TableHead className="text-right">Status Breakdown</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {client.products.map((product) => (
                              <TableRow key={product.productId}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Link
                                      to={`/products/${product.productId}`}
                                      className="font-medium hover:underline"
                                    >
                                      {product.productName}
                                    </Link>
                                    {product.isEap && (
                                      <Badge variant="outline" className="gap-1 text-purple-600">
                                        <FlaskConical className="h-3 w-3" />
                                        EAP
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  {product.deploymentCount}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-end gap-2">
                                    <StatusBadge count={product.statusBreakdown.notStarted} type="notStarted" icon={Clock} />
                                    <StatusBadge count={product.statusBreakdown.inProgress} type="inProgress" icon={PlayCircle} />
                                    <StatusBadge count={product.statusBreakdown.blocked} type="blocked" icon={AlertTriangle} />
                                    <StatusBadge count={product.statusBreakdown.released} type="released" icon={CheckCircle} />
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredData.byProduct.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {search ? "No products match your search" : "No products with clients found"}
                </div>
              ) : (
                filteredData.byProduct.map((product) => (
                  <Collapsible
                    key={product.productId}
                    open={expandedRows.has(product.productId)}
                    onOpenChange={() => toggleRow(product.productId)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          {expandedRows.has(product.productId) ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                            <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/products/${product.productId}`}
                                className="font-medium hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {product.productName}
                              </Link>
                              {product.isEap && (
                                <Badge variant="outline" className="gap-1 text-purple-600">
                                  <FlaskConical className="h-3 w-3" />
                                  EAP
                                </Badge>
                              )}
                            </div>
                            {product.deliveryLead && (
                              <p className="text-xs text-muted-foreground">Lead: {product.deliveryLead}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <StatusBadge count={product.statusBreakdown.notStarted} type="notStarted" icon={Clock} />
                            <StatusBadge count={product.statusBreakdown.inProgress} type="inProgress" icon={PlayCircle} />
                            <StatusBadge count={product.statusBreakdown.blocked} type="blocked" icon={AlertTriangle} />
                            <StatusBadge count={product.statusBreakdown.released} type="released" icon={CheckCircle} />
                          </div>
                          <Badge variant="outline">{product.clientCount} clients</Badge>
                          <Badge variant="secondary">{product.totalDeployments} deployments</Badge>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-8 mr-4 mb-2 mt-1 border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Client</TableHead>
                              <TableHead className="text-center">Deployments</TableHead>
                              <TableHead className="text-right">Latest Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {product.clients.map((client) => (
                              <TableRow key={client.clientId}>
                                <TableCell>
                                  <Link
                                    to={`/clients/${client.clientId}`}
                                    className="font-medium hover:underline"
                                  >
                                    {client.clientName}
                                  </Link>
                                </TableCell>
                                <TableCell className="text-center">
                                  {client.deploymentCount}
                                </TableCell>
                                <TableCell className="text-right">
                                  {client.latestStatus ? (
                                    <Badge
                                      variant={
                                        client.latestStatus === "Released" ? "success" :
                                        client.latestStatus === "Blocked" ? "destructive" :
                                        client.latestStatus === "In Progress" ? "default" :
                                        "secondary"
                                      }
                                    >
                                      {client.latestStatus}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
