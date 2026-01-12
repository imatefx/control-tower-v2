import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { deploymentsAPI, productsAPI, clientsAPI } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Search, ExternalLink, Loader2, List, LayoutGrid, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

const environments = ["production", "sandbox", "qa"]
const statuses = ["Not Started", "In Progress", "Blocked", "Released"]
const deploymentTypes = ["ga", "eap", "feature-release", "client-specific"]

const formatEnvironment = (env) => {
  if (!env) return "-"
  if (env.toLowerCase() === "qa") return "QA"
  return env.charAt(0).toUpperCase() + env.slice(1)
}

const formatDeploymentType = (type) => {
  if (!type) return "-"
  if (type.toLowerCase() === "ga") return "GA"
  if (type.toLowerCase() === "eap") return "EAP"
  // Convert "client-specific" or "feature-release" to "Client Specific" or "Feature Release"
  return type.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
}

export default function DeploymentsPage() {
  const [search, setSearch] = useState("")
  const [view, setView] = useState("list")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDeployment, setEditingDeployment] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, deployment: null })
  const [formData, setFormData] = useState({
    productId: "",
    clientId: "",
    environment: "production",
    status: "Not Started",
    deploymentType: "ga",
    featureName: "",
    releaseItems: "",
    notes: "",
  })
  const queryClient = useQueryClient()
  const { canEdit } = useAuth()

  const { data: deployments, isLoading } = useQuery({
    queryKey: ["deployments", search],
    queryFn: () => deploymentsAPI.list({ search }),
  })

  const { data: products } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => productsAPI.list({ pageSize: 100 }),
  })

  const { data: clients } = useQuery({
    queryKey: ["clients-all"],
    queryFn: () => clientsAPI.list({ pageSize: 100 }),
  })

  const createMutation = useMutation({
    mutationFn: deploymentsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] })
      closeDialog()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => deploymentsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] })
      closeDialog()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deploymentsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] })
      setDeleteDialog({ open: false, deployment: null })
    },
  })

  const resetForm = () => {
    setFormData({
      productId: "",
      clientId: "",
      environment: "production",
      status: "Not Started",
      deploymentType: "ga",
      featureName: "",
      releaseItems: "",
      notes: "",
    })
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingDeployment(null)
    resetForm()
  }

  const openEditDialog = (deployment) => {
    setEditingDeployment(deployment)
    setFormData({
      productId: deployment.productId || "",
      clientId: deployment.clientId || "",
      environment: deployment.environment || "production",
      status: deployment.status || "Not Started",
      deploymentType: deployment.deploymentType || "ga",
      featureName: deployment.featureName || "",
      releaseItems: deployment.releaseItems || "",
      notes: deployment.notes || "",
    })
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingDeployment(null)
    resetForm()
    setDialogOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingDeployment) {
      updateMutation.mutate({ id: editingDeployment.id, ...formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = () => {
    if (deleteDialog.deployment) {
      deleteMutation.mutate(deleteDialog.deployment.id)
    }
  }

  const statusColors = {
    "Not Started": "secondary",
    "In Progress": "info",
    "Blocked": "destructive",
    "Released": "success",
  }

  const groupedByStatus = deployments?.rows?.reduce((acc, d) => {
    const status = d.status || "Not Started"
    if (!acc[status]) acc[status] = []
    acc[status].push(d)
    return acc
  }, {}) || {}

  const statusOrder = ["Not Started", "In Progress", "Blocked", "Released"]

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deployments</h1>
          <p className="text-muted-foreground">Track and manage all deployments</p>
        </div>
        {canEdit() && (
          <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                New Deployment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingDeployment ? "Edit Deployment" : "Create Deployment"}</DialogTitle>
                  <DialogDescription>
                    {editingDeployment ? "Update deployment details" : "Set up a new deployment for a client"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="productId">Product *</Label>
                      <Select
                        value={formData.productId}
                        onValueChange={(value) => setFormData({ ...formData, productId: value })}
                        disabled={!!editingDeployment}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products?.rows?.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientId">Client *</Label>
                      <Select
                        value={formData.clientId}
                        onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                        disabled={!!editingDeployment}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients?.rows?.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="environment">Environment</Label>
                      <Select
                        value={formData.environment}
                        onValueChange={(value) => setFormData({ ...formData, environment: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {environments.map((env) => (
                            <SelectItem key={env} value={env}>
                              {env.charAt(0).toUpperCase() + env.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deploymentType">Deployment Type</Label>
                      <Select
                        value={formData.deploymentType}
                        onValueChange={(value) => setFormData({ ...formData, deploymentType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {deploymentTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="featureName">Feature Name</Label>
                      <Input
                        id="featureName"
                        value={formData.featureName}
                        onChange={(e) => setFormData({ ...formData, featureName: e.target.value })}
                        placeholder="e.g., New Login Flow"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="releaseItems">Release Items</Label>
                    <Textarea
                      id="releaseItems"
                      value={formData.releaseItems}
                      onChange={(e) => setFormData({ ...formData, releaseItems: e.target.value })}
                      placeholder="List of items to be released..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes..."
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingDeployment ? "Save Changes" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search deployments..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "kanban" ? "default" : "outline"}
            size="icon"
            onClick={() => setView("kanban")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : view === "list" ? (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deployments?.rows?.map((deployment) => (
                  <TableRow key={deployment.id}>
                    <TableCell className="font-medium">
                      {deployment.productName}
                    </TableCell>
                    <TableCell>{deployment.clientName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatEnvironment(deployment.environment)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[deployment.status]}>
                        {deployment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 w-32">
                        <Progress value={deployment.checklistProgress || 0} className="h-2" />
                        <span className="text-xs text-muted-foreground w-8">
                          {deployment.checklistProgress || 0}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{formatDeploymentType(deployment.deploymentType)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/deployments/${deployment.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                        {canEdit() && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(deployment)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteDialog({ open: true, deployment })}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!deployments?.rows || deployments.rows.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No deployments found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {statusOrder.map((status) => (
            <div key={status} className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-muted rounded-t-lg">
                <Badge variant={statusColors[status]}>
                  {status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {groupedByStatus[status]?.length || 0}
                </span>
              </div>
              <div className="space-y-2 min-h-[200px]">
                {groupedByStatus[status]?.map((deployment) => (
                  <Card key={deployment.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <Link to={`/deployments/${deployment.id}`}>
                        <div className="font-medium text-sm">{deployment.productName}</div>
                        <div className="text-xs text-muted-foreground">{deployment.clientName}</div>
                        <div className="mt-2 flex items-center gap-2">
                          <Progress value={deployment.checklistProgress || 0} className="h-1 flex-1" />
                          <span className="text-xs text-muted-foreground">
                            {deployment.checklistProgress || 0}%
                          </span>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deployment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the deployment for "{deleteDialog.deployment?.productName}" - "{deleteDialog.deployment?.clientName}"? This action cannot be undone.
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
