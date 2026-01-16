import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { productsAPI } from "@/services/api"
import { toast } from "@/hooks/useToast"
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
import { Progress } from "@/components/ui/progress"
import {
  Plus,
  Search,
  Package,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  LayoutGrid,
  List,
  User,
  Rocket,
  FlaskConical,
  Layers,
  Users,
  GitBranch,
  FileText,
  ChevronRight,
  Filter,
  Plug,
  Cog,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

// Product Card Component - Enhanced
function ProductCard({ product, onEdit, onDelete, canEdit }) {
  // Calculate a "health" score based on data completeness
  const getHealthScore = () => {
    let score = 0
    if (product.productOwner) score += 20
    if (product.engineeringOwner) score += 20
    if (product.deliveryLead) score += 20
    if (product.description) score += 20
    if (product.documentation?.productGuide || product.documentation?.releaseNotes) score += 20
    return score
  }

  const healthScore = getHealthScore()

  const getHealthColor = () => {
    if (healthScore >= 80) return "bg-emerald-500"
    if (healthScore >= 60) return "bg-amber-500"
    return "bg-rose-500"
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
      <div className={`h-1.5 ${product.eap?.isActive ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-gradient-to-r from-emerald-500 to-teal-500"}`} />
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <Link to={`/products/${product.id}`} className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-lg ${product.eap?.isActive ? "bg-purple-100" : "bg-blue-100"}`}>
                <Package className={`h-4 w-4 ${product.eap?.isActive ? "text-purple-600" : "text-blue-600"}`} />
              </div>
              <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-1">
                {product.name}
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
                <DropdownMenuItem onClick={() => onEdit(product)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(product)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[40px]">
          {product.description || "No description available"}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {product.eap?.isActive && (
            <Badge variant="purple" className="text-xs gap-1">
              <FlaskConical className="h-3 w-3" />
              EAP
            </Badge>
          )}
          {product.isAdapter && (
            <Badge variant="warning" className="text-xs gap-1">
              <Plug className="h-3 w-3" />
              Adapter
            </Badge>
          )}
          {product.adapterServices?.hasEquipmentSA && (
            <Badge variant="outline" className="text-xs">SA</Badge>
          )}
          {product.adapterServices?.hasEquipmentSE && (
            <Badge variant="outline" className="text-xs">SE</Badge>
          )}
          {product.parentId && product.parentName && (
            <Badge variant="secondary" className="text-xs">{product.parentName}</Badge>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Rocket className="h-3 w-3" />
              Deployments
            </div>
            <p className="font-semibold text-lg">{product.deploymentCount || 0}</p>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <GitBranch className="h-3 w-3" />
              Sub-products
            </div>
            <p className="font-semibold text-lg">{product.subProductCount || 0}</p>
          </div>
        </div>

        {/* Health Score */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Data completeness</span>
            <span className="font-medium">{healthScore}%</span>
          </div>
          <Progress value={healthScore} className={`h-1.5 ${getHealthColor()}`} />
        </div>

        {/* Owners Section */}
        <div className="pt-3 border-t space-y-1.5">
          {product.deliveryLead && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3 w-3 text-cyan-500" />
              <span className="truncate">DL: {product.deliveryLead}</span>
            </div>
          )}
          {product.productOwner && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3 w-3 text-amber-500" />
              <span className="truncate">PO: {product.productOwner}</span>
            </div>
          )}
          {product.engineeringOwner && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3 w-3 text-emerald-500" />
              <span className="truncate">EO: {product.engineeringOwner}</span>
            </div>
          )}
          {!product.deliveryLead && !product.productOwner && !product.engineeringOwner && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
              <User className="h-3 w-3" />
              <span>No owners assigned</span>
            </div>
          )}
        </div>

        {/* View Details Link */}
        <Link
          to={`/products/${product.id}`}
          className="mt-4 flex items-center justify-center gap-1 w-full py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
        >
          View Details
          <ChevronRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  )
}

export default function ProductsPage() {
  const [search, setSearch] = useState("")
  const [view, setView] = useState("cards")
  const [productFilter, setProductFilter] = useState("main") // "all", "main", "sub"
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, product: null })
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    productOwner: "",
    engineeringOwner: "",
    deliveryLead: "",
    parentId: "",
    isEap: false,
    isAdapter: false,
    hasEquipmentSA: false,
    hasEquipmentSE: false,
    hasMappingService: false,
    hasConstructionService: false,
  })
  const queryClient = useQueryClient()
  const { canEdit } = useAuth()

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", search],
    queryFn: () => productsAPI.list({ search }),
  })

  const { data: mainProducts } = useQuery({
    queryKey: ["products", "main"],
    queryFn: () => productsAPI.list({ type: "main" }),
  })

  // Filter products based on selection
  const filteredProducts = useMemo(() => {
    if (!products?.rows) return []
    if (productFilter === "main") {
      return products.rows.filter(p => !p.parentId)
    } else if (productFilter === "sub") {
      return products.rows.filter(p => p.parentId)
    }
    return products.rows
  }, [products?.rows, productFilter])

  const createMutation = useMutation({
    mutationFn: productsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      closeDialog()
      toast.success("Product created successfully")
    },
    onError: () => {
      toast.error("Failed to create product")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => productsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      closeDialog()
      toast.success("Product updated successfully")
    },
    onError: () => {
      toast.error("Failed to update product")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: productsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      setDeleteDialog({ open: false, product: null })
      toast.success("Product deleted successfully")
    },
    onError: () => {
      toast.error("Failed to delete product")
    },
  })

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      productOwner: "",
      engineeringOwner: "",
      deliveryLead: "",
      parentId: "",
      isEap: false,
      isAdapter: false,
      hasEquipmentSA: false,
      hasEquipmentSE: false,
      hasMappingService: false,
      hasConstructionService: false,
    })
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingProduct(null)
    resetForm()
  }

  const openEditDialog = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name || "",
      description: product.description || "",
      productOwner: product.productOwner || "",
      engineeringOwner: product.engineeringOwner || "",
      deliveryLead: product.deliveryLead || "",
      parentId: product.parentId || "",
      isEap: product.eap?.isActive || false,
      isAdapter: product.isAdapter || false,
      hasEquipmentSA: product.adapterServices?.hasEquipmentSA || false,
      hasEquipmentSE: product.adapterServices?.hasEquipmentSE || false,
      hasMappingService: product.adapterServices?.hasMappingService || false,
      hasConstructionService: product.adapterServices?.hasConstructionService || false,
    })
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingProduct(null)
    resetForm()
    setDialogOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      name: formData.name,
      description: formData.description,
      productOwner: formData.productOwner,
      engineeringOwner: formData.engineeringOwner,
      deliveryLead: formData.deliveryLead,
      parentId: formData.parentId || null,
      eap: { isActive: formData.isEap },
      isAdapter: formData.isAdapter,
      adapterServices: {
        hasEquipmentSA: formData.hasEquipmentSA,
        hasEquipmentSE: formData.hasEquipmentSE,
        hasMappingService: formData.hasMappingService,
        hasConstructionService: formData.hasConstructionService,
      },
    }

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, ...payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = () => {
    if (deleteDialog.product) {
      deleteMutation.mutate(deleteDialog.product.id)
    }
  }

  const typeColors = {
    main: "default",
    sub: "secondary",
    standalone: "outline",
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  // Stats for the filter badges
  const mainCount = products?.rows?.filter(p => !p.parentId).length || 0
  const subCount = products?.rows?.filter(p => p.parentId).length || 0
  const totalCount = products?.rows?.length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <Package className="h-6 w-6" />
            </div>
            Products
          </h1>
          <p className="text-muted-foreground mt-1">Manage your product catalog</p>
        </div>
        {canEdit() && (
          <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                  <DialogDescription>
                    {editingProduct ? "Update product details" : "Create a new product in the catalog"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
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
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deliveryLead" className="flex items-center gap-2">
                        <User className="h-3 w-3 text-cyan-500" />
                        Delivery Lead
                      </Label>
                      <Input
                        id="deliveryLead"
                        value={formData.deliveryLead}
                        onChange={(e) => setFormData({ ...formData, deliveryLead: e.target.value })}
                        placeholder="Primary owner for deployments"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="productOwner" className="flex items-center gap-2">
                          <User className="h-3 w-3 text-amber-500" />
                          Product Owner
                        </Label>
                        <Input
                          id="productOwner"
                          value={formData.productOwner}
                          onChange={(e) => setFormData({ ...formData, productOwner: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="engineeringOwner" className="flex items-center gap-2">
                          <User className="h-3 w-3 text-emerald-500" />
                          Engineering Owner
                        </Label>
                        <Input
                          id="engineeringOwner"
                          value={formData.engineeringOwner}
                          onChange={(e) => setFormData({ ...formData, engineeringOwner: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parentId">Parent Product (makes this a sub-product)</Label>
                    <Select
                      value={formData.parentId || "none"}
                      onValueChange={(value) => setFormData({ ...formData, parentId: value === "none" ? "" : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent product" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (Main Product)</SelectItem>
                        {mainProducts?.rows?.filter(p => p.id !== editingProduct?.id).map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isEap"
                      checked={formData.isEap}
                      onChange={(e) => setFormData({ ...formData, isEap: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="isEap" className="flex items-center gap-2">
                      <FlaskConical className="h-4 w-4 text-purple-500" />
                      Early Access Program (EAP)
                    </Label>
                  </div>

                  {/* Adapter Section */}
                  <div className="border-t pt-4 mt-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isAdapter"
                        checked={formData.isAdapter}
                        onChange={(e) => setFormData({ ...formData, isAdapter: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="isAdapter" className="flex items-center gap-2">
                        <Plug className="h-4 w-4 text-amber-500" />
                        This is an Adapter Product
                      </Label>
                    </div>

                    {formData.isAdapter && (
                      <div className="ml-6 p-3 bg-muted rounded-lg space-y-2">
                        <p className="text-xs text-muted-foreground mb-2">Select adapter services:</p>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.hasEquipmentSA}
                              onChange={(e) => setFormData({ ...formData, hasEquipmentSA: e.target.checked })}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <span className="text-sm">Equipment SA</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.hasEquipmentSE}
                              onChange={(e) => setFormData({ ...formData, hasEquipmentSE: e.target.checked })}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <span className="text-sm">Equipment SE</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.hasMappingService}
                              onChange={(e) => setFormData({ ...formData, hasMappingService: e.target.checked })}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <span className="text-sm">Mapping Service</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.hasConstructionService}
                              onChange={(e) => setFormData({ ...formData, hasConstructionService: e.target.checked })}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <span className="text-sm">Construction Service</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingProduct ? "Save Changes" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search, Filter, and View Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {/* Product Type Filter */}
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={productFilter === "main" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setProductFilter("main")
                toast.info("Showing main products")
              }}
              className="gap-1"
            >
              <Package className="h-3.5 w-3.5" />
              Main
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">{mainCount}</Badge>
            </Button>
            <Button
              variant={productFilter === "sub" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setProductFilter("sub")
                toast.info("Showing sub-products")
              }}
              className="gap-1"
            >
              <GitBranch className="h-3.5 w-3.5" />
              Sub
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">{subCount}</Badge>
            </Button>
            <Button
              variant={productFilter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setProductFilter("all")
                toast.info("Showing all products")
              }}
              className="gap-1"
            >
              All
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">{totalCount}</Badge>
            </Button>
          </div>
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <Button
            variant={view === "cards" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setView("cards")
              toast.info("Switched to card view")
            }}
            className="gap-2"
          >
            <LayoutGrid className="h-4 w-4" />
            Cards
          </Button>
          <Button
            variant={view === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setView("list")
              toast.info("Switched to list view")
            }}
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
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={openEditDialog}
              onDelete={(p) => setDeleteDialog({ open: true, product: p })}
              canEdit={canEdit()}
            />
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No products found</p>
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
                  <TableHead>Type</TableHead>
                  <TableHead>Delivery Lead</TableHead>
                  <TableHead>EAP / Parent</TableHead>
                  <TableHead>Deployments</TableHead>
                  <TableHead>Sub-products</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Link to={`/products/${product.id}`} className="flex items-center gap-2 hover:text-primary">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{product.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={typeColors[product.parentId ? "sub" : "main"]}>
                        {product.parentId ? "Sub" : "Main"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {product.deliveryLead ? (
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-cyan-500" />
                          {product.deliveryLead}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.eap?.isActive ? (
                        <Badge variant="purple">EAP</Badge>
                      ) : product.parentName ? (
                        <Badge variant="secondary">{product.parentName}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{product.deploymentCount || 0}</TableCell>
                    <TableCell>{product.subProductCount || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/products/${product.id}`}>
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
                              <DropdownMenuItem onClick={() => openEditDialog(product)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteDialog({ open: true, product })}
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
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No products found
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
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.product?.name}"? This action cannot be undone.
              {deleteDialog.product?.deploymentCount > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This product has {deleteDialog.product.deploymentCount} deployment(s) associated with it.
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
