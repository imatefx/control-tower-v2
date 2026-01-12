import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { productsAPI, deploymentsAPI } from "@/services/api"
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
import { Loader2, FlaskConical, ExternalLink, Users, Rocket, TrendingUp } from "lucide-react"

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

  const isLoading = productsLoading || deploymentsLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const totalEAPProducts = eapProducts?.length || 0
  const totalEAPDeployments = deployments?.rows?.length || 0
  const uniqueClients = new Set(deployments?.rows?.map((d) => d.clientId)).size
  const completedEAP = deployments?.rows?.filter((d) => d.status === "completed").length || 0

  const statusColors = {
    not_started: "secondary",
    in_progress: "info",
    blocked: "destructive",
    completed: "success",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FlaskConical className="h-8 w-8" />
          EAP Dashboard
        </h1>
        <p className="text-muted-foreground">
          Early Access Program overview and tracking
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              EAP Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEAPProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Deployments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEAPDeployments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Participating Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueClients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{completedEAP}</div>
              {totalEAPDeployments > 0 && (
                <Badge variant="success" className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {Math.round((completedEAP / totalEAPDeployments) * 100)}%
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>EAP Products</CardTitle>
            <CardDescription>Products currently in Early Access</CardDescription>
          </CardHeader>
          <CardContent>
            {eapProducts && eapProducts.length > 0 ? (
              <div className="space-y-4">
                {eapProducts.map((product) => {
                  const productDeployments = deployments?.rows?.filter(
                    (d) => d.productId === product.id
                  ) || []
                  const completed = productDeployments.filter(
                    (d) => d.status === "completed"
                  ).length
                  const progressPercent =
                    productDeployments.length > 0
                      ? Math.round((completed / productDeployments.length) * 100)
                      : 0

                  return (
                    <div key={product.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Link
                            to={`/products/${product.id}`}
                            className="font-medium hover:underline"
                          >
                            {product.name}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            {product.description || "No description"}
                          </p>
                        </div>
                        <Badge variant="warning">EAP</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Rocket className="h-4 w-4" />
                          {productDeployments.length} deployments
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {new Set(productDeployments.map((d) => d.clientId)).size} clients
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={progressPercent} className="flex-1 h-2" />
                        <span className="text-xs text-muted-foreground w-10">
                          {progressPercent}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No EAP products found
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>EAP Deployments</CardTitle>
            <CardDescription>All deployments for EAP products</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deployments?.rows?.slice(0, 10).map((deployment) => (
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
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/deployments/${deployment.id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!deployments?.rows || deployments.rows.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No EAP deployments found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
