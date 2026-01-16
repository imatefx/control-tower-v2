import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, Link } from "react-router-dom"
import { productsAPI, resourceAllocationAPI } from "@/services/api"
import { formatDate } from "@/utils/dateFormat"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Users,
  Plus,
  Loader2,
  Clock,
  ArrowLeft,
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

const RESOURCE_ROLES = [
  { code: "FE", name: "Frontend Developer" },
  { code: "BE", name: "Backend Developer" },
  { code: "UX", name: "UX Designer" },
  { code: "DEVOPS", name: "DevOps Engineer" },
  { code: "ARCH", name: "Solution Architect" },
  { code: "PM", name: "Project Manager" },
  { code: "QA", name: "QA/Test Lead" },
  { code: "TL", name: "Team Lead" },
  { code: "PO", name: "Product Owner" },
  { code: "DATA", name: "Data Engineer/Analyst" },
]

const getRoleName = (code) => {
  const role = RESOURCE_ROLES.find(r => r.code === code)
  return role?.name || code
}

export default function ResourceAllocationDetailPage() {
  const { productId } = useParams()
  const queryClient = useQueryClient()
  const { canEdit } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAllocation, setEditingAllocation] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, allocation: null })
  const [formData, setFormData] = useState({
    role: "",
    hours: "",
    comment: "",
    startDate: "",
    endDate: "",
  })

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => productsAPI.get(productId),
  })

  const { data: allocations, isLoading: allocationsLoading } = useQuery({
    queryKey: ["resource-allocation", productId],
    queryFn: () => resourceAllocationAPI.getByProduct(productId),
  })

  const { data: summary } = useQuery({
    queryKey: ["resource-allocation-summary", productId],
    queryFn: () => resourceAllocationAPI.getSummary(productId),
  })

  const createMutation = useMutation({
    mutationFn: resourceAllocationAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resource-allocation"] })
      queryClient.invalidateQueries({ queryKey: ["resource-allocation-summary"] })
      queryClient.invalidateQueries({ queryKey: ["resource-allocation-summaries"] })
      closeDialog()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => resourceAllocationAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resource-allocation"] })
      queryClient.invalidateQueries({ queryKey: ["resource-allocation-summary"] })
      queryClient.invalidateQueries({ queryKey: ["resource-allocation-summaries"] })
      closeDialog()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: resourceAllocationAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resource-allocation"] })
      queryClient.invalidateQueries({ queryKey: ["resource-allocation-summary"] })
      queryClient.invalidateQueries({ queryKey: ["resource-allocation-summaries"] })
      setDeleteDialog({ open: false, allocation: null })
    },
  })

  const resetForm = () => {
    setFormData({
      role: "",
      hours: "",
      comment: "",
      startDate: "",
      endDate: "",
    })
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingAllocation(null)
    resetForm()
  }

  const openEditDialog = (allocation) => {
    setEditingAllocation(allocation)
    setFormData({
      role: allocation.role,
      hours: allocation.hours,
      comment: allocation.comment || "",
      startDate: allocation.startDate || "",
      endDate: allocation.endDate || "",
    })
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingAllocation(null)
    resetForm()
    setDialogOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      productId,
      role: formData.role,
      hours: parseFloat(formData.hours),
      comment: formData.comment || null,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
    }

    if (editingAllocation) {
      updateMutation.mutate({ id: editingAllocation.id, ...payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = () => {
    if (deleteDialog.allocation) {
      deleteMutation.mutate(deleteDialog.allocation.id)
    }
  }

  const isLoading = productLoading || allocationsLoading
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/resource-allocation">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                <Users className="h-6 w-6" />
              </div>
              {product?.name || "Loading..."}
            </h1>
            <p className="text-muted-foreground mt-1">Resource Allocation</p>
          </div>
        </div>
        {canEdit() && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog() }}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Allocation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingAllocation ? "Edit Allocation" : "Add Allocation"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingAllocation ? "Update resource allocation details" : "Add a new resource allocation for this product"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {RESOURCE_ROLES.map((role) => (
                          <SelectItem key={role.code} value={role.code}>
                            {role.name} ({role.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hours">Hours *</Label>
                    <Input
                      id="hours"
                      type="number"
                      step="0.5"
                      min="0"
                      value={formData.hours}
                      onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                      placeholder="e.g., 40"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comment">Comment</Label>
                    <Textarea
                      id="comment"
                      value={formData.comment}
                      onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                      placeholder="Description of work..."
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
                    {editingAllocation ? "Save Changes" : "Add Allocation"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary Card */}
      <Card className="border-l-4 border-l-cyan-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-cyan-500" />
            Total Allocated
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-cyan-600">
            {summary?.totalHours || 0} hours
          </div>
          {summary?.byRole && summary.byRole.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {summary.byRole.map((r) => (
                <span
                  key={r.role}
                  className="px-2 py-1 bg-slate-100 rounded-full text-xs font-medium"
                >
                  {getRoleName(r.role)}: {r.totalHours}h ({r.count})
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Allocations Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocations?.map((allocation) => (
                  <TableRow key={allocation.id}>
                    <TableCell className="font-medium">
                      {getRoleName(allocation.role)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {allocation.hours}h
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {allocation.comment || "-"}
                    </TableCell>
                    <TableCell>
                      {allocation.startDate ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {formatDate(allocation.startDate)}
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      {allocation.endDate ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {formatDate(allocation.endDate)}
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {canEdit() && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(allocation)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteDialog({ open: true, allocation })}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(!allocations || allocations.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      No resource allocations yet
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
            <AlertDialogTitle>Delete Allocation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this allocation for "{deleteDialog.allocation && getRoleName(deleteDialog.allocation.role)}"? This action cannot be undone.
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
