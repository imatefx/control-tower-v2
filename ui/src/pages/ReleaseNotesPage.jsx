import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { releaseNotesAPI, productsAPI } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Plus, FileText, Search, Loader2, Package, Calendar, Tag, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

const itemTypes = [
  { value: "feature", label: "Feature", color: "success" },
  { value: "bugfix", label: "Bug Fix", color: "destructive" },
  { value: "improvement", label: "Improvement", color: "info" },
  { value: "breaking", label: "Breaking Change", color: "warning" },
  { value: "deprecation", label: "Deprecation", color: "secondary" },
]

export default function ReleaseNotesPage() {
  const [search, setSearch] = useState("")
  const [productFilter, setProductFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRelease, setEditingRelease] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, release: null })
  const [formData, setFormData] = useState({
    productId: "",
    version: "",
    releaseDate: new Date().toISOString().split("T")[0],
    summary: "",
    items: [{ type: "feature", title: "", description: "" }],
  })
  const queryClient = useQueryClient()
  const { canEdit } = useAuth()

  const { data: releaseNotes, isLoading } = useQuery({
    queryKey: ["release-notes", search, productFilter],
    queryFn: () => releaseNotesAPI.list({ search, productId: productFilter === "all" ? undefined : productFilter }),
  })

  const { data: products } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => productsAPI.list({ pageSize: 100 }),
  })

  const createMutation = useMutation({
    mutationFn: releaseNotesAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["release-notes"] })
      closeDialog()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => releaseNotesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["release-notes"] })
      closeDialog()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: releaseNotesAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["release-notes"] })
      setDeleteDialog({ open: false, release: null })
    },
  })

  const resetForm = () => {
    setFormData({
      productId: "",
      version: "",
      releaseDate: new Date().toISOString().split("T")[0],
      summary: "",
      items: [{ type: "feature", title: "", description: "" }],
    })
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingRelease(null)
    resetForm()
  }

  const openEditDialog = (release) => {
    setEditingRelease(release)
    setFormData({
      productId: release.productId || "",
      version: release.version || "",
      releaseDate: release.releaseDate ? new Date(release.releaseDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      summary: release.summary || "",
      items: release.items && release.items.length > 0 ? release.items : [{ type: "feature", title: "", description: "" }],
    })
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingRelease(null)
    resetForm()
    setDialogOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingRelease) {
      updateMutation.mutate({ id: editingRelease.id, ...formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = () => {
    if (deleteDialog.release) {
      deleteMutation.mutate(deleteDialog.release.id)
    }
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { type: "feature", title: "", description: "" }],
    })
  }

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData({ ...formData, items: newItems })
  }

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    })
  }

  const getTypeColor = (type) => {
    return itemTypes.find((t) => t.value === type)?.color || "default"
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8" />
            Release Notes
          </h1>
          <p className="text-muted-foreground">
            Track product versions and changes
          </p>
        </div>
        {canEdit() && (
          <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                New Release
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingRelease ? "Edit Release Notes" : "Create Release Notes"}</DialogTitle>
                  <DialogDescription>
                    {editingRelease ? "Update release documentation" : "Document a new product release"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="productId">Product *</Label>
                      <Select
                        value={formData.productId}
                        onValueChange={(value) =>
                          setFormData({ ...formData, productId: value })
                        }
                        disabled={!!editingRelease}
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
                      <Label htmlFor="version">Version *</Label>
                      <Input
                        id="version"
                        value={formData.version}
                        onChange={(e) =>
                          setFormData({ ...formData, version: e.target.value })
                        }
                        placeholder="e.g., 2.1.0"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="releaseDate">Release Date</Label>
                    <Input
                      id="releaseDate"
                      type="date"
                      value={formData.releaseDate}
                      onChange={(e) =>
                        setFormData({ ...formData, releaseDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="summary">Summary</Label>
                    <Textarea
                      id="summary"
                      value={formData.summary}
                      onChange={(e) =>
                        setFormData({ ...formData, summary: e.target.value })
                      }
                      placeholder="Brief description of this release..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Release Items</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addItem}>
                        <Plus className="h-3 w-3 mr-1" />
                        Add Item
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {formData.items.map((item, index) => (
                        <div key={index} className="border rounded-lg p-3 space-y-2">
                          <div className="flex gap-2">
                            <Select
                              value={item.type}
                              onValueChange={(value) => updateItem(index, "type", value)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {itemTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              value={item.title}
                              onChange={(e) => updateItem(index, "title", e.target.value)}
                              placeholder="Item title"
                              className="flex-1"
                            />
                            {formData.items.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(index)}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                          <Textarea
                            value={item.description}
                            onChange={(e) => updateItem(index, "description", e.target.value)}
                            placeholder="Description (optional)"
                            rows={2}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingRelease ? "Save Changes" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search release notes..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Products" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {products?.rows?.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {releaseNotes?.rows?.map((release) => (
            <Card key={release.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {release.product?.name || products?.rows?.find(p => p.id === release.productId)?.name || "Unknown Product"}
                      <Badge variant="outline" className="ml-2">
                        <Tag className="h-3 w-3 mr-1" />
                        v{release.version}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(release.releaseDate).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {canEdit() && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(release)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteDialog({ open: true, release })}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                {release.summary && (
                  <p className="text-sm mt-2">{release.summary}</p>
                )}
              </CardHeader>
              <CardContent>
                {release.items && release.items.length > 0 ? (
                  <Accordion type="single" collapsible>
                    {itemTypes.map((type) => {
                      const typeItems = release.items.filter((i) => i.type === type.value)
                      if (typeItems.length === 0) return null
                      return (
                        <AccordionItem key={type.value} value={type.value}>
                          <AccordionTrigger>
                            <div className="flex items-center gap-2">
                              <Badge variant={type.color}>{type.label}</Badge>
                              <span className="text-sm text-muted-foreground">
                                ({typeItems.length})
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="space-y-2 pl-4">
                              {typeItems.map((item, idx) => (
                                <li key={idx} className="text-sm">
                                  <span className="font-medium">{item.title}</span>
                                  {item.description && (
                                    <p className="text-muted-foreground mt-1">
                                      {item.description}
                                    </p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
                ) : (
                  <p className="text-sm text-muted-foreground">No items documented</p>
                )}
              </CardContent>
            </Card>
          ))}
          {(!releaseNotes?.rows || releaseNotes.rows.length === 0) && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No release notes found</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Release Notes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the release notes for version "{deleteDialog.release?.version}"? This action cannot be undone.
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
