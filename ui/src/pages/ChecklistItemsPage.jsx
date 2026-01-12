import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { checklistTemplatesAPI } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Loader2,
  CheckSquare,
  Pencil,
  Trash2,
  GripVertical,
  RotateCcw,
  ListChecks,
  CheckCircle2,
  XCircle,
  Hash,
  Search,
  LayoutGrid,
  List,
  FileText,
  MoreHorizontal,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function ChecklistCard({ item, onEdit, onDelete }) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
      <div className={`h-1.5 bg-gradient-to-r ${item.isActive !== false ? 'from-emerald-500 to-green-500' : 'from-slate-400 to-slate-500'}`} />
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <button
            onClick={() => onEdit(item)}
            className="flex-1 text-left"
          >
            <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-1">
              {item.label}
            </h3>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(item)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(item)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Hash className="h-4 w-4" />
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{item.key}</code>
        </div>

        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {item.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          {item.isActive !== false ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              Active
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700">
              <XCircle className="h-3 w-3" />
              Inactive
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ListChecks className="h-3 w-3" />
            Order: {item.sortOrder || "-"}
          </div>
        </div>

        <button
          onClick={() => onEdit(item)}
          className="mt-4 w-full text-center text-sm text-primary hover:underline font-medium"
        >
          Edit Item
        </button>
      </CardContent>
    </Card>
  )
}

export default function ChecklistItemsPage() {
  const [search, setSearch] = useState("")
  const [view, setView] = useState("cards")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null })
  const [formData, setFormData] = useState({
    key: "",
    label: "",
    description: "",
    isActive: true,
  })
  const queryClient = useQueryClient()

  const { data: checklistItems, isLoading } = useQuery({
    queryKey: ["checklist-templates"],
    queryFn: () => checklistTemplatesAPI.list(),
  })

  const createMutation = useMutation({
    mutationFn: checklistTemplatesAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-templates"] })
      closeDialog()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => checklistTemplatesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-templates"] })
      closeDialog()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: checklistTemplatesAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-templates"] })
      setDeleteDialog({ open: false, item: null })
    },
  })

  const seedMutation = useMutation({
    mutationFn: checklistTemplatesAPI.seedDefaults,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-templates"] })
    },
  })

  const resetForm = () => {
    setFormData({
      key: "",
      label: "",
      description: "",
      isActive: true,
    })
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingItem(null)
    resetForm()
  }

  const openEditDialog = (item) => {
    setEditingItem(item)
    setFormData({
      key: item.key || "",
      label: item.label || "",
      description: item.description || "",
      isActive: item.isActive !== false,
    })
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingItem(null)
    resetForm()
    setDialogOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...formData,
      key: formData.key.toLowerCase().replace(/\s+/g, "_"),
      sortOrder: editingItem ? editingItem.sortOrder : (items.length || 0) + 1,
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, ...payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = () => {
    if (deleteDialog.item) {
      deleteMutation.mutate(deleteDialog.item.id)
    }
  }

  const handleSeedDefaults = () => {
    seedMutation.mutate()
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const allItems = checklistItems?.rows || checklistItems || []
  const items = allItems.filter(item =>
    search === "" ||
    item.label?.toLowerCase().includes(search.toLowerCase()) ||
    item.key?.toLowerCase().includes(search.toLowerCase())
  )

  const activeCount = allItems.filter(item => item.isActive !== false).length
  const inactiveCount = allItems.filter(item => item.isActive === false).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg text-white">
              <CheckSquare className="h-6 w-6" />
            </div>
            Checklist Items
          </h1>
          <p className="text-muted-foreground">
            Manage deployment checklist items
          </p>
        </div>
        <div className="flex items-center gap-2">
          {allItems.length === 0 && (
            <Button variant="outline" onClick={handleSeedDefaults} disabled={seedMutation.isPending}>
              {seedMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <RotateCcw className="mr-2 h-4 w-4" />
              Load Defaults
            </Button>
          )}
          <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Edit Checklist Item" : "Add Checklist Item"}</DialogTitle>
                  <DialogDescription>
                    {editingItem ? "Update checklist item details" : "Create a new checklist item for deployments"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="key">Key *</Label>
                    <Input
                      id="key"
                      value={formData.key}
                      onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                      placeholder="e.g., requirements_gathering"
                      required
                      disabled={!!editingItem}
                    />
                    <p className="text-xs text-muted-foreground">
                      Unique identifier (lowercase, underscores). Cannot be changed after creation.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="label">Label *</Label>
                    <Input
                      id="label"
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      placeholder="e.g., Requirements Gathering"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description for this checklist item..."
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="isActive">Active</Label>
                    <span className="text-xs text-muted-foreground">
                      (Inactive items won't appear in new deployments)
                    </span>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingItem ? "Save Changes" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-teal-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{allItems.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Checklist items configured</p>
              </div>
              <div className="p-3 bg-teal-100 rounded-full">
                <ListChecks className="h-5 w-5 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Items</p>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Used in new deployments</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-slate-400">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inactive Items</p>
                <p className="text-2xl font-bold">{inactiveCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Disabled items</p>
              </div>
              <div className="p-3 bg-slate-100 rounded-full">
                <XCircle className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search checklist items..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={view === "cards" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("cards")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : view === "cards" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((item) => (
                <ChecklistCard
                  key={item.id}
                  item={item}
                  onEdit={openEditDialog}
                  onDelete={(item) => setDeleteDialog({ open: true, item })}
                />
              ))}
              {items.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  {allItems.length === 0
                    ? "No checklist items configured. Click \"Load Defaults\" to add the standard items, or create custom ones."
                    : "No matching checklist items found"}
                </div>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-1 py-0.5 rounded">
                        {item.key}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">
                      <button
                        onClick={() => openEditDialog(item)}
                        className="hover:text-primary hover:underline transition-colors"
                      >
                        {item.label}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {item.description || "-"}
                    </TableCell>
                    <TableCell>
                      {item.isActive !== false ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(item)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteDialog({ open: true, item })}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {allItems.length === 0
                        ? "No checklist items configured. Click \"Load Defaults\" to add the standard items, or create custom ones."
                        : "No matching checklist items found"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Checklist Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.item?.label}"?
              This will remove it from the checklist template. Existing deployments will not be affected.
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
