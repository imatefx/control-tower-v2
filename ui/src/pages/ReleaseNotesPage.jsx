import { useState, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { releaseNotesAPI, productsAPI, releaseNoteTemplatesAPI } from "@/services/api"
import { formatDate } from "@/utils/dateFormat"
import { toast } from "@/hooks/useToast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
  DropdownMenuSeparator,
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
  Plus,
  FileText,
  Search,
  Loader2,
  Package,
  Calendar,
  Tag,
  MoreHorizontal,
  Pencil,
  Trash2,
  LayoutGrid,
  List,
  Sparkles,
  Bug,
  Zap,
  AlertTriangle,
  Clock,
  ChevronRight,
  Eye,
  Download,
  FileDown,
  Layout
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import ReleaseNotePreview from "@/components/ReleaseNotePreview"
import { exportReleaseNoteToPDF } from "@/lib/pdfExport"

const itemTypes = [
  { value: "feature", label: "Feature", color: "success", icon: Sparkles, gradient: "from-emerald-500 to-green-500", bgLight: "bg-emerald-50", textColor: "text-emerald-700" },
  { value: "bugfix", label: "Bug Fix", color: "destructive", icon: Bug, gradient: "from-red-500 to-rose-500", bgLight: "bg-red-50", textColor: "text-red-700" },
  { value: "improvement", label: "Improvement", color: "info", icon: Zap, gradient: "from-blue-500 to-indigo-500", bgLight: "bg-blue-50", textColor: "text-blue-700" },
  { value: "breaking", label: "Breaking Change", color: "warning", icon: AlertTriangle, gradient: "from-amber-500 to-orange-500", bgLight: "bg-amber-50", textColor: "text-amber-700" },
  { value: "deprecation", label: "Deprecation", color: "secondary", icon: Clock, gradient: "from-slate-400 to-slate-500", bgLight: "bg-slate-50", textColor: "text-slate-700" },
]

function ReleaseCard({ release, products, onView, onEdit, onDelete, canEdit }) {
  const productName = release.product?.name || products?.rows?.find(p => p.id === release.productId)?.name || "Unknown Product"

  const getGradient = () => {
    if (!release.items || release.items.length === 0) return "from-slate-400 to-slate-500"
    if (release.items.some(i => i.type === "breaking")) return "from-amber-500 to-orange-500"
    if (release.items.some(i => i.type === "feature")) return "from-emerald-500 to-green-500"
    if (release.items.some(i => i.type === "improvement")) return "from-blue-500 to-indigo-500"
    if (release.items.some(i => i.type === "bugfix")) return "from-red-500 to-rose-500"
    return "from-slate-400 to-slate-500"
  }

  const itemCounts = itemTypes.reduce((acc, type) => {
    acc[type.value] = release.items?.filter(i => i.type === type.value).length || 0
    return acc
  }, {})

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
      <div className={`h-1.5 bg-gradient-to-r ${getGradient()}`} />
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <button onClick={() => onView(release)} className="flex-1 text-left">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{productName}</span>
            </div>
            <h3 className="font-semibold text-lg hover:text-primary transition-colors flex items-center gap-2">
              v{release.version}
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
              <DropdownMenuItem onClick={() => onView(release)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              {canEdit && (
                <>
                  <DropdownMenuItem onClick={() => onEdit(release)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => onDelete(release)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(release.releaseDate)}</span>
        </div>

        {release.summary && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{release.summary}</p>
        )}

        <div className="flex flex-wrap gap-1.5 mb-3">
          {itemTypes.map(type => {
            const count = itemCounts[type.value]
            if (count === 0) return null
            const TypeIcon = type.icon
            return (
              <div
                key={type.value}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${type.bgLight} ${type.textColor}`}
              >
                <TypeIcon className="h-3 w-3" />
                {count} {type.label}{count > 1 ? 's' : ''}
              </div>
            )
          })}
        </div>

        <button
          onClick={() => onView(release)}
          className="w-full text-center text-sm text-primary hover:underline font-medium flex items-center justify-center gap-1"
        >
          View Details
          <ChevronRight className="h-4 w-4" />
        </button>
      </CardContent>
    </Card>
  )
}

export default function ReleaseNotesPage() {
  const [search, setSearch] = useState("")
  const [view, setView] = useState("cards")
  const [productFilter, setProductFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewingRelease, setViewingRelease] = useState(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [editingRelease, setEditingRelease] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, release: null })
  const [isExporting, setIsExporting] = useState(false)
  const [formData, setFormData] = useState({
    productId: "",
    templateId: "",
    version: "",
    releaseDate: new Date().toISOString().split("T")[0],
    summary: "",
    items: [{ type: "feature", title: "", description: "" }],
  })
  const previewRef = useRef(null)
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

  const { data: templates } = useQuery({
    queryKey: ["release-note-templates"],
    queryFn: () => releaseNoteTemplatesAPI.getActive(),
  })

  const createMutation = useMutation({
    mutationFn: releaseNotesAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["release-notes"] })
      closeDialog()
      toast.success("Release note created")
    },
    onError: () => {
      toast.error("Failed to create release note")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => releaseNotesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["release-notes"] })
      closeDialog()
      toast.success("Release note updated")
    },
    onError: () => {
      toast.error("Failed to update release note")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: releaseNotesAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["release-notes"] })
      setDeleteDialog({ open: false, release: null })
      toast.success("Release note deleted")
    },
    onError: () => {
      toast.error("Failed to delete release note")
    },
  })

  const resetForm = () => {
    setFormData({
      productId: "",
      templateId: "",
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
      templateId: release.templateId || "",
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

  const openViewDialog = (release) => {
    setViewingRelease(release)
    // Set default template - use release's template or first available
    const defaultTemplate = release.templateId || (templates && templates.length > 0 ? templates[0].id : "")
    setSelectedTemplateId(defaultTemplate)
    setViewDialogOpen(true)
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

  const handleExportPDF = async () => {
    if (!previewRef.current || !viewingRelease) return

    setIsExporting(true)
    try {
      const template = templates?.find(t => t.id === selectedTemplateId) || templates?.[0]
      const product = products?.rows?.find(p => p.id === viewingRelease.productId)
      await exportReleaseNoteToPDF(viewingRelease, template, product, previewRef.current)
      toast.success("PDF exported successfully")
    } catch (error) {
      console.error("Failed to export PDF:", error)
      toast.error("Failed to export PDF")
    } finally {
      setIsExporting(false)
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

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  // Get current template and product for preview
  const currentTemplate = templates?.find(t => t.id === selectedTemplateId) || templates?.[0]
  const currentProduct = viewingRelease ? products?.rows?.find(p => p.id === viewingRelease.productId) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg text-white">
              <FileText className="h-6 w-6" />
            </div>
            Release Notes
          </h1>
          <p className="text-muted-foreground">Track product versions and changes</p>
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
                        onValueChange={(value) => setFormData({ ...formData, productId: value })}
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
                      <Label htmlFor="templateId">Template</Label>
                      <Select
                        value={formData.templateId}
                        onValueChange={(value) => setFormData({ ...formData, templateId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates?.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              <div className="flex items-center gap-2">
                                <Layout className="h-4 w-4" />
                                {template.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.templateId && templates?.find(t => t.id === formData.templateId)?.description && (
                        <p className="text-xs text-muted-foreground">
                          {templates.find(t => t.id === formData.templateId).description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="version">Version *</Label>
                      <Input
                        id="version"
                        value={formData.version}
                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                        placeholder="e.g., 2.1.0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="releaseDate">Release Date</Label>
                      <Input
                        id="releaseDate"
                        type="date"
                        value={formData.releaseDate}
                        onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="summary">Summary</Label>
                    <Textarea
                      id="summary"
                      value={formData.summary}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
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
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}>
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
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingRelease ? "Save Changes" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
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
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={view === "cards" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => {
                  setView("cards")
                  toast.info("Switched to card view")
                }}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => {
                  setView("list")
                  toast.info("Switched to list view")
                }}
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
              {releaseNotes?.rows?.map((release) => (
                <ReleaseCard
                  key={release.id}
                  release={release}
                  products={products}
                  onView={openViewDialog}
                  onEdit={openEditDialog}
                  onDelete={(r) => setDeleteDialog({ open: true, release: r })}
                  canEdit={canEdit()}
                />
              ))}
              {(!releaseNotes?.rows || releaseNotes.rows.length === 0) && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No release notes found
                </div>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Release Date</TableHead>
                  <TableHead>Changes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {releaseNotes?.rows?.map((release) => {
                  const productName = release.product?.name || products?.rows?.find(p => p.id === release.productId)?.name || "Unknown"
                  return (
                    <TableRow key={release.id}>
                      <TableCell className="font-medium">
                        <button
                          onClick={() => openViewDialog(release)}
                          className="hover:text-primary hover:underline transition-colors"
                        >
                          {productName}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <Tag className="h-3 w-3 mr-1" />
                          v{release.version}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(release.releaseDate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {itemTypes.map(type => {
                            const count = release.items?.filter(i => i.type === type.value).length || 0
                            if (count === 0) return null
                            return (
                              <Badge key={type.value} variant={type.color} className="text-xs">
                                {count} {type.label}
                              </Badge>
                            )
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openViewDialog(release)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            {canEdit() && (
                              <>
                                <DropdownMenuItem onClick={() => openEditDialog(release)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeleteDialog({ open: true, release })}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {(!releaseNotes?.rows || releaseNotes.rows.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No release notes found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View/Preview Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between pr-8">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Release Notes Preview
                </DialogTitle>
                <DialogDescription>
                  View and export release notes with different templates
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <Layout className="h-4 w-4" />
                          {template.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto bg-muted/30 rounded-lg p-4">
            <ReleaseNotePreview
              ref={previewRef}
              releaseNote={viewingRelease}
              template={currentTemplate}
              product={currentProduct}
            />
          </div>

          <DialogFooter className="border-t pt-4">
            <div className="flex items-center gap-2 w-full justify-between">
              <div className="text-sm text-muted-foreground">
                {currentTemplate && (
                  <span className="flex items-center gap-1">
                    <Layout className="h-4 w-4" />
                    Template: {currentTemplate.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {canEdit() && (
                  <Button variant="outline" onClick={() => {
                    setViewDialogOpen(false)
                    if (viewingRelease) openEditDialog(viewingRelease)
                  }}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
                <Button onClick={handleExportPDF} disabled={isExporting}>
                  {isExporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download PDF
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
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
