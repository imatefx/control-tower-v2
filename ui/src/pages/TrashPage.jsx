import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { productsAPI, clientsAPI, deploymentsAPI } from "@/services/api"
import { toast } from "@/hooks/useToast"
import { formatDate } from "@/utils/dateFormat"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Search,
  Calendar,
  Archive,
  Clock,
} from "lucide-react"

export default function TrashPage() {
  const [restoreDialog, setRestoreDialog] = useState(null)
  const [search, setSearch] = useState("")
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
      toast.success("Product restored successfully")
    },
    onError: () => {
      toast.error("Failed to restore product")
    },
  })

  const restoreClientMutation = useMutation({
    mutationFn: (id) => clientsAPI.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      setRestoreDialog(null)
      toast.success("Client restored successfully")
    },
    onError: () => {
      toast.error("Failed to restore client")
    },
  })

  const restoreDeploymentMutation = useMutation({
    mutationFn: (id) => deploymentsAPI.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] })
      setRestoreDialog(null)
      toast.success("Deployment restored successfully")
    },
    onError: () => {
      toast.error("Failed to restore deployment")
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

  const productsCount = deletedProducts?.rows?.length || 0
  const clientsCount = deletedClients?.rows?.length || 0
  const deploymentsCount = deletedDeployments?.rows?.length || 0
  const totalDeleted = productsCount + clientsCount + deploymentsCount

  const filterItems = (items) => {
    if (!search) return items
    return items?.filter(
      (item) =>
        item.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.productName?.toLowerCase().includes(search.toLowerCase()) ||
        item.clientName?.toLowerCase().includes(search.toLowerCase()) ||
        item.code?.toLowerCase().includes(search.toLowerCase())
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white">
            <Trash2 className="h-6 w-6" />
          </div>
          Trash
        </h1>
        <p className="text-muted-foreground mt-1">View and restore deleted items</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-slate-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Archive className="h-4 w-4 text-slate-500" />
              Total Deleted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeleted}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Permanent deletion after 30 days
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-500" />
              Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{productsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Deleted products</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-500" />
              Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{clientsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Deleted clients</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Rocket className="h-4 w-4 text-purple-500" />
              Deployments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{deploymentsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Deleted deployments</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search deleted items..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <Tabs defaultValue="products">
          <TabsList className="bg-muted p-1 rounded-lg">
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Products
              {productsCount > 0 && (
                <Badge variant="secondary" className="ml-1">{productsCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-2">
              <Users className="h-4 w-4" />
              Clients
              {clientsCount > 0 && (
                <Badge variant="secondary" className="ml-1">{clientsCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="deployments" className="gap-2">
              <Rocket className="h-4 w-4" />
              Deployments
              {deploymentsCount > 0 && (
                <Badge variant="secondary" className="ml-1">{deploymentsCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-500" />
                  Deleted Products
                </CardTitle>
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
                    {filterItems(deletedProducts?.rows)?.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{product.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {product.parentId ? "Sub-product" : "Main"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {formatDate(product.deletedAt)}
                          </div>
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
                    {(!deletedProducts?.rows || filterItems(deletedProducts?.rows).length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12">
                          <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                          <p className="text-muted-foreground">No deleted products</p>
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
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-500" />
                  Deleted Clients
                </CardTitle>
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
                    {filterItems(deletedClients?.rows)?.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{client.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {client.code}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {formatDate(client.deletedAt)}
                          </div>
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
                    {(!deletedClients?.rows || filterItems(deletedClients?.rows).length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                          <p className="text-muted-foreground">No deleted clients</p>
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
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-purple-500" />
                  Deleted Deployments
                </CardTitle>
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
                    {filterItems(deletedDeployments?.rows)?.map((deployment) => (
                      <TableRow key={deployment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Rocket className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{deployment.productName}</span>
                          </div>
                        </TableCell>
                        <TableCell>{deployment.clientName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {formatDate(deployment.deletedAt)}
                          </div>
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
                    {(!deletedDeployments?.rows || filterItems(deletedDeployments?.rows).length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12">
                          <Rocket className="h-12 w-12 mx-auto mb-4 opacity-20" />
                          <p className="text-muted-foreground">No deleted deployments</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <AlertDialog open={!!restoreDialog} onOpenChange={() => setRestoreDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-emerald-500" />
              Restore Item
            </AlertDialogTitle>
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
