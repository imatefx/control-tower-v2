import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { clientsAPI, productsAPI } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Plus,
  Search,
  Users,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  LayoutGrid,
  List,
  Rocket,
  Building2,
  Package,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

// Client Card Component - Simplified to show only essential details
function ClientCard({ client, onEdit, onDelete, canEdit }) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-purple-500 to-pink-500" />
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-4">
          <Link to={`/clients/${client.id}`} className="flex-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-300" />
              </div>
              <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-1">
                {client.name}
              </h3>
            </div>
          </Link>
          {canEdit && (
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
                <DropdownMenuItem onClick={() => onEdit(client)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(client)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Stats - Only Products and Deployments */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/50">
            <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 mb-1">
              <Package className="h-3.5 w-3.5" />
              Products
            </div>
            <p className="font-bold text-2xl text-blue-900 dark:text-blue-100">{client.productCount || 0}</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mb-1">
              <Rocket className="h-3.5 w-3.5" />
              Deployments
            </div>
            <p className="font-bold text-2xl text-emerald-900 dark:text-emerald-100">{client.deploymentCount || 0}</p>
          </div>
        </div>

        {/* View Details Link */}
        <Link
          to={`/clients/${client.id}`}
          className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
        >
          View Details
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  )
}

export default function ClientsPage() {
  const [search, setSearch] = useState("")
  const [view, setView] = useState("cards") // Default to cards
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, client: null })
  const [formData, setFormData] = useState({
    name: "",
    cdgOwner: "",
    productIds: [],
    comments: "",
  })
  const queryClient = useQueryClient()
  const { canEdit } = useAuth()

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients", search],
    queryFn: () => clientsAPI.list({ search }),
  })

  const { data: products } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => productsAPI.list({ pageSize: 100 }),
  })

  const createMutation = useMutation({
    mutationFn: clientsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      closeDialog()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => clientsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      closeDialog()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: clientsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      setDeleteDialog({ open: false, client: null })
    },
  })

  const resetForm = () => {
    setFormData({
      name: "",
      cdgOwner: "",
      productIds: [],
      comments: "",
    })
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingClient(null)
    resetForm()
  }

  const openEditDialog = (client) => {
    setEditingClient(client)
    setFormData({
      name: client.name || "",
      cdgOwner: client.cdgOwner || "",
      productIds: client.productIds || [],
      comments: client.comments || "",
    })
    setDialogOpen(true)
  }

  const handleProductToggle = (productId) => {
    const current = formData.productIds || []
    if (current.includes(productId)) {
      setFormData({ ...formData, productIds: current.filter(id => id !== productId) })
    } else {
      setFormData({ ...formData, productIds: [...current, productId] })
    }
  }

  const openCreateDialog = () => {
    setEditingClient(null)
    resetForm()
    setDialogOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, ...formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = () => {
    if (deleteDialog.client) {
      deleteMutation.mutate(deleteDialog.client.id)
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white">
              <Users className="h-6 w-6" />
            </div>
            Clients
          </h1>
          <p className="text-muted-foreground mt-1">Manage your client base</p>
        </div>
        {canEdit() && (
          <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingClient ? "Edit Client" : "Add New Client"}</DialogTitle>
                  <DialogDescription>
                    {editingClient ? "Update client details" : "Create a new client in the system"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Client Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter client name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cdgOwner">CDG Owner</Label>
                    <Input
                      id="cdgOwner"
                      value={formData.cdgOwner}
                      onChange={(e) => setFormData({ ...formData, cdgOwner: e.target.value })}
                      placeholder="Enter CDG owner name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Products</Label>
                    <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                      {products?.rows?.length > 0 ? (
                        products.rows.map((product) => (
                          <label
                            key={product.id}
                            className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                          >
                            <Checkbox
                              checked={formData.productIds?.includes(product.id)}
                              onCheckedChange={() => handleProductToggle(product.id)}
                            />
                            <span className="text-sm">{product.name}</span>
                          </label>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-2">No products available</p>
                      )}
                    </div>
                    {formData.productIds?.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {formData.productIds.length} product(s) selected
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comments">Notes</Label>
                    <Textarea
                      id="comments"
                      value={formData.comments}
                      onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                      placeholder="Optional notes about this client"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingClient ? "Save Changes" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search and View Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
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

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : view === "cards" ? (
        /* Card View */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {clients?.rows?.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={openEditDialog}
              onDelete={(c) => setDeleteDialog({ open: true, client: c })}
              canEdit={canEdit()}
            />
          ))}
          {(!clients?.rows || clients.rows.length === 0) && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No clients found</p>
            </div>
          )}
        </div>
      ) : (
        /* List View */
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-center">Products</TableHead>
                  <TableHead className="text-center">Deployments</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients?.rows?.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Link to={`/clients/${client.id}`} className="flex items-center gap-2 hover:text-primary">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{client.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="gap-1">
                        <Package className="h-3 w-3" />
                        {client.productCount || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="gap-1">
                        <Rocket className="h-3 w-3" />
                        {client.deploymentCount || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/clients/${client.id}`}>
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
                              <DropdownMenuItem onClick={() => openEditDialog(client)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteDialog({ open: true, client })}
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
                {(!clients?.rows || clients.rows.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No clients found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.client?.name}"? This action cannot be undone.
              {deleteDialog.client?.deploymentCount > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This client has {deleteDialog.client.deploymentCount} deployment(s) associated with it.
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
