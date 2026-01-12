import { useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { productsAPI, deploymentsAPI } from "@/services/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Package, Rocket, Users, ExternalLink, Loader2, Pencil, Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { canEdit } = useAuth()
  const [deleteDialog, setDeleteDialog] = useState(false)

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsAPI.get(id),
  })

  const { data: deployments } = useQuery({
    queryKey: ["deployments", "product", id],
    queryFn: () => deploymentsAPI.list({ productId: id }),
  })

  const { data: subProducts } = useQuery({
    queryKey: ["products", "children", id],
    queryFn: () => productsAPI.getChildren(id),
    enabled: product?.type === "main",
  })

  const deleteMutation = useMutation({
    mutationFn: () => productsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      navigate("/products")
    },
  })

  const handleDelete = () => {
    deleteMutation.mutate()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Product not found</p>
        <Button asChild className="mt-4">
          <Link to="/products">Back to Products</Link>
        </Button>
      </div>
    )
  }

  const statusColors = {
    not_started: "secondary",
    in_progress: "info",
    blocked: "destructive",
    completed: "success",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="h-8 w-8" />
            {product.name}
          </h1>
          <p className="text-muted-foreground">{product.description || "No description"}</p>
        </div>
        {canEdit() && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild>
              <Link to={`/products/${id}/edit`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="icon" onClick={() => setDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge>{product.type}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={product.isEap ? "warning" : "success"}>
              {product.isEap ? "EAP" : "GA"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Deployments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deployments?.total || 0}</div>
          </CardContent>
        </Card>
        {product.parent && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Parent Product</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                to={`/products/${product.parent.id}`}
                className="text-primary hover:underline"
              >
                {product.parent.name}
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue="deployments">
        <TabsList>
          <TabsTrigger value="deployments">
            <Rocket className="mr-2 h-4 w-4" />
            Deployments
          </TabsTrigger>
          {product.type === "main" && (
            <TabsTrigger value="subproducts">
              <Package className="mr-2 h-4 w-4" />
              Sub Products
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="deployments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployments</CardTitle>
              <CardDescription>All deployments for this product</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Environment</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deployments?.rows?.map((deployment) => (
                    <TableRow key={deployment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {deployment.clientName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[deployment.status]}>
                          {deployment.status?.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {deployment.environment?.toLowerCase() === "qa"
                          ? "QA"
                          : deployment.environment
                            ? deployment.environment.charAt(0).toUpperCase() + deployment.environment.slice(1)
                            : "-"}
                      </TableCell>
                      <TableCell>{deployment.version || "-"}</TableCell>
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
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No deployments found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {product.type === "main" && (
          <TabsContent value="subproducts" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Sub Products</CardTitle>
                <CardDescription>Child products under this main product</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subProducts?.map((subProduct) => (
                      <TableRow key={subProduct.id}>
                        <TableCell className="font-medium">{subProduct.name}</TableCell>
                        <TableCell>{subProduct.description || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={subProduct.isEap ? "warning" : "success"}>
                            {subProduct.isEap ? "EAP" : "GA"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/products/${subProduct.id}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!subProducts || subProducts.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No sub products found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{product.name}"? This action cannot be undone.
              {product.deploymentCount > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This product has {product.deploymentCount} deployment(s) associated with it.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
