import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { clientsAPI } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  Globe,
  Mail,
  Building2,
  Star,
  Crown,
  Sparkles,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

const regions = ["NA", "EU", "APAC", "LATAM", "MEA"]
const tiers = ["enterprise", "business", "starter"]

// Client Card Component
function ClientCard({ client, onEdit, onDelete, canEdit }) {
  const tierConfig = {
    enterprise: { color: "bg-gradient-to-r from-amber-500 to-orange-500", icon: Crown, badgeVariant: "default" },
    business: { color: "bg-gradient-to-r from-blue-500 to-indigo-500", icon: Star, badgeVariant: "secondary" },
    starter: { color: "bg-gradient-to-r from-slate-400 to-slate-500", icon: Sparkles, badgeVariant: "outline" },
  }

  const tier = client.tier || "business"
  const config = tierConfig[tier] || tierConfig.business
  const TierIcon = config.icon

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
      <div className={`h-1.5 ${config.color}`} />
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <Link to={`/clients/${client.id}`} className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-purple-100">
                <Building2 className="h-4 w-4 text-purple-600" />
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

        {/* Code Badge */}
        {client.code && (
          <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono mb-3 inline-block">
            {client.code}
          </code>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <Badge variant={config.badgeVariant} className="text-xs gap-1">
            <TierIcon className="h-3 w-3" />
            {tier.charAt(0).toUpperCase() + tier.slice(1)}
          </Badge>
          {client.region && (
            <Badge variant="outline" className="text-xs gap-1">
              <Globe className="h-3 w-3" />
              {client.region}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
            <div className="flex items-center gap-1.5 text-xs text-blue-600">
              <Rocket className="h-3 w-3" />
              Deployments
            </div>
            <p className="font-semibold text-lg text-blue-900 dark:text-blue-100">{client.deploymentCount || 0}</p>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              Products
            </div>
            <p className="font-semibold text-lg">{client.productCount || 0}</p>
          </div>
        </div>

        {/* Contact Info */}
        {(client.contactName || client.contactEmail) && (
          <div className="pt-3 border-t space-y-1.5">
            {client.contactName && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{client.contactName}</span>
              </div>
            )}
            {client.contactEmail && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span className="truncate">{client.contactEmail}</span>
              </div>
            )}
          </div>
        )}

        {/* View Details Link */}
        <Link
          to={`/clients/${client.id}`}
          className="mt-4 flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
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
    code: "",
    region: "",
    tier: "business",
    contactEmail: "",
    contactName: "",
    comments: "",
  })
  const queryClient = useQueryClient()
  const { canEdit } = useAuth()

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients", search],
    queryFn: () => clientsAPI.list({ search }),
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
      code: "",
      region: "",
      tier: "business",
      contactEmail: "",
      contactName: "",
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
      code: client.code || "",
      region: client.region || "",
      tier: client.tier || "business",
      contactEmail: client.contactEmail || "",
      contactName: client.contactName || "",
      comments: client.comments || "",
    })
    setDialogOpen(true)
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

  const tierColors = {
    enterprise: "default",
    business: "secondary",
    starter: "outline",
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="code">Code</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="e.g., ACME"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="region">Region</Label>
                      <Select
                        value={formData.region || "none"}
                        onValueChange={(value) => setFormData({ ...formData, region: value === "none" ? "" : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {regions.map((region) => (
                            <SelectItem key={region} value={region}>
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tier">Tier</Label>
                      <Select
                        value={formData.tier}
                        onValueChange={(value) => setFormData({ ...formData, tier: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {tiers.map((tier) => (
                            <SelectItem key={tier} value={tier}>
                              {tier.charAt(0).toUpperCase() + tier.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Contact Name</Label>
                      <Input
                        id="contactName"
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Contact Email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comments">Comments</Label>
                    <Textarea
                      id="comments"
                      value={formData.comments}
                      onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
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
                  <TableHead>Code</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Deployments</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients?.rows?.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Link to={`/clients/${client.id}`} className="flex items-center gap-2 hover:text-primary">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{client.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {client.code ? (
                        <code className="text-sm bg-muted px-1 py-0.5 rounded">
                          {client.code}
                        </code>
                      ) : "-"}
                    </TableCell>
                    <TableCell>{client.region || "-"}</TableCell>
                    <TableCell>
                      {client.tier ? (
                        <Badge variant={tierColors[client.tier]}>
                          {client.tier.charAt(0).toUpperCase() + client.tier.slice(1)}
                        </Badge>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      {client.contactName ? (
                        <div className="text-sm">
                          <div>{client.contactName}</div>
                          <div className="text-muted-foreground">{client.contactEmail}</div>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{client.deploymentCount || 0}</TableCell>
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
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
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
