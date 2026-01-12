import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { productsAPI, clientsAPI, deploymentsAPI } from "@/services/api"
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
import {
  Trash2,
  Loader2,
  RotateCcw,
  Package,
  Users,
  Rocket,
  AlertTriangle,
} from "lucide-react"

export default function TrashPage() {
  const [restoreDialog, setRestoreDialog] = useState(null)
  const [permanentDeleteDialog, setPermanentDeleteDialog] = useState(null)
  const queryClient = useQueryClient()

  const { data: deletedProducts, isLoading: productsLoading } = useQuery({
    queryKey: ["products", "deleted"],
    queryFn: () => productsAPI.list({ deleted: true }),
  })

  const { data: deletedClients, isLoading: clientsLoading } = useQuery({
    queryKey: ["clients", "deleted"],
    queryFn: () => clientsAPI.list({ deleted: true }),
  })

  const { data: deletedDeployments, isLoading: deploymentsLoading } = useQuery({
    queryKey: ["deployments", "deleted"],
    queryFn: () => deploymentsAPI.list({ deleted: true }),
  })

  const restoreProductMutation = useMutation({
    mutationFn: (id) => productsAPI.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      setRestoreDialog(null)
    },
  })

  const restoreClientMutation = useMutation({
    mutationFn: (id) => clientsAPI.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      setRestoreDialog(null)
    },
  })

  const restoreDeploymentMutation = useMutation({
    mutationFn: (id) => deploymentsAPI.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] })
      setRestoreDialog(null)
    },
  })

  const handleRestore = () => {
    if (!restoreDialog) return
    switch (restoreDialog.type) {
      case "product":
        restoreProductMutation.mutate(restoreDialog.id)
        break
      case "client":
        restoreClientMutation.mutate(restoreDialog.id)
        break
      case "deployment":
        restoreDeploymentMutation.mutate(restoreDialog.id)
        break
    }
  }

  const isLoading = productsLoading || clientsLoading || deploymentsLoading
  const isRestoring =
    restoreProductMutation.isPending ||
    restoreClientMutation.isPending ||
    restoreDeploymentMutation.isPending

  const totalDeleted =
    (deletedProducts?.rows?.length || 0) +
    (deletedClients?.rows?.length || 0) +
    (deletedDeployments?.rows?.length || 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Trash2 className="h-8 w-8" />
          Trash
        </h1>
        <p className="text-muted-foreground">
          View and restore deleted items
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Deleted Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDeleted}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Items are permanently deleted after 30 days
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">
            <Package className="mr-2 h-4 w-4" />
            Products ({deletedProducts?.rows?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="clients">
            <Users className="mr-2 h-4 w-4" />
            Clients ({deletedClients?.rows?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="deployments">
            <Rocket className="mr-2 h-4 w-4" />
            Deployments ({deletedDeployments?.rows?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Deleted Products</CardTitle>
              <CardDescription>Products that have been soft-deleted</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Deleted At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deletedProducts?.rows?.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {product.type ? product.type.charAt(0).toUpperCase() + product.type.slice(1) : "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(product.deletedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setRestoreDialog({ type: "product", id: product.id, name: product.name })
                          }
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restore
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!deletedProducts?.rows || deletedProducts.rows.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No deleted products
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Deleted Clients</CardTitle>
              <CardDescription>Clients that have been soft-deleted</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Deleted At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deletedClients?.rows?.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-1 py-0.5 rounded">
                          {client.code}
                        </code>
                      </TableCell>
                      <TableCell>
                        {new Date(client.deletedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setRestoreDialog({ type: "client", id: client.id, name: client.name })
                          }
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restore
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!deletedClients?.rows || deletedClients.rows.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No deleted clients
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Deleted Deployments</CardTitle>
              <CardDescription>Deployments that have been soft-deleted</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Deleted At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deletedDeployments?.rows?.map((deployment) => (
                    <TableRow key={deployment.id}>
                      <TableCell className="font-medium">
                        {deployment.productName}
                      </TableCell>
                      <TableCell>{deployment.clientName}</TableCell>
                      <TableCell>
                        {new Date(deployment.deletedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setRestoreDialog({
                              type: "deployment",
                              id: deployment.id,
                              name: `${deployment.productName} - ${deployment.clientName}`,
                            })
                          }
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restore
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!deletedDeployments?.rows || deletedDeployments.rows.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No deleted deployments
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!restoreDialog} onOpenChange={() => setRestoreDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore "{restoreDialog?.name}"? This will make it
              active again in the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={isRestoring}>
              {isRestoring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
