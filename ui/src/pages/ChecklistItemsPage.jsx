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
} from "lucide-react"

export default function ChecklistItemsPage() {
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
      sortOrder: editingItem ? editingItem.sortOrder : (checklistItems?.rows?.length || 0) + 1,
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

  const items = checklistItems?.rows || checklistItems || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CheckSquare className="h-8 w-8" />
            Checklist Items
          </h1>
          <p className="text-muted-foreground">
            Manage deployment checklist items
          </p>
        </div>
        <div className="flex items-center gap-2">
          {items.length === 0 && (
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

      <Card>
        <CardHeader>
          <CardTitle>Checklist Items</CardTitle>
          <CardDescription>
            These items will be used as the checklist for all deployments.
            Active items will appear in the deployment checklist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
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
                {items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-1 py-0.5 rounded">
                        {item.key}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">{item.label}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {item.description || "-"}
                    </TableCell>
                    <TableCell>
                      {item.isActive !== false ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteDialog({ open: true, item })}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No checklist items configured. Click "Load Defaults" to add the standard items, or create custom ones.
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
