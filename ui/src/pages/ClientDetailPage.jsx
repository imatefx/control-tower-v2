import { useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { clientsAPI, deploymentsAPI, productsAPI } from "@/services/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { ArrowLeft, Users, Rocket, Package, ExternalLink, Loader2, Pencil, Trash2, CheckCircle, Clock, AlertTriangle, Building2, FileText, Plus, Link as LinkIcon } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { canEdit } = useAuth()
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [docDialogOpen, setDocDialogOpen] = useState(false)
  const [deleteDocDialog, setDeleteDocDialog] = useState({ open: false, doc: null })
  const [docForm, setDocForm] = useState({ title: "", url: "" })

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", id],
    queryFn: () => clientsAPI.get(id),
  })

  const { data: deployments } = useQuery({
    queryKey: ["deployments", "client", id],
    queryFn: () => deploymentsAPI.list({ clientId: id }),
  })

  // Fetch all products to get the ones assigned to this client
  const { data: allProducts } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => productsAPI.list({ pageSize: 200 }),
  })

  // Get assigned products based on productIds
  const assignedProducts = allProducts?.rows?.filter(p =>
    client?.productIds?.includes(p.id)
  ) || []

  const deleteMutation = useMutation({
    mutationFn: () => clientsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      navigate("/clients")
    },
  })

  const addDocMutation = useMutation({
    mutationFn: (data) => clientsAPI.addDocumentation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", id] })
      setDocDialogOpen(false)
      setDocForm({ title: "", url: "" })
    },
  })

  const removeDocMutation = useMutation({
    mutationFn: (docId) => clientsAPI.removeDocumentation(id, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", id] })
      setDeleteDocDialog({ open: false, doc: null })
    },
  })

  const handleDelete = () => {
    deleteMutation.mutate()
  }

  const handleAddDoc = (e) => {
    e.preventDefault()
    addDocMutation.mutate(docForm)
  }

  const handleDeleteDoc = () => {
    if (deleteDocDialog.doc) {
      removeDocMutation.mutate(deleteDocDialog.doc.id)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Client not found</p>
        <Button asChild className="mt-4">
          <Link to="/clients">Back to Clients</Link>
        </Button>
      </div>
    )
  }

  const statusColors = {
    not_started: "secondary",
    "Not Started": "secondary",
    in_progress: "info",
    "In Progress": "info",
    blocked: "destructive",
    "Blocked": "destructive",
    completed: "success",
    "Released": "success",
  }

  // Calculate deployment metrics
  const deploymentRows = deployments?.rows || []
  const totalDeployments = deploymentRows.length
  const completedDeployments = deploymentRows.filter(d =>
    d.status === "Released" || d.status === "completed"
  ).length
  const inProgressDeployments = deploymentRows.filter(d =>
    d.status === "In Progress" || d.status === "in_progress"
  ).length
  const blockedDeployments = deploymentRows.filter(d =>
    d.status === "Blocked" || d.status === "blocked"
  ).length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/clients">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
              <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{client.name}</h1>
              {client.cdgOwner && (
                <p className="text-sm text-muted-foreground">CDG Owner: {client.cdgOwner}</p>
              )}
            </div>
          </div>
        </div>
        {canEdit() && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild>
              <Link to={`/clients/${id}/edit`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="icon" onClick={() => setDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-100 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{assignedProducts.length}</div>
            <p className="text-xs text-blue-600 dark:text-blue-400">assigned products</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 border-emerald-100 dark:border-emerald-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{completedDeployments}</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">deployments released</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border-amber-100 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">{inProgressDeployments}</div>
            <p className="text-xs text-amber-600 dark:text-amber-400">active deployments</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/50 dark:to-red-950/50 border-rose-100 dark:border-rose-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Blocked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-900 dark:text-rose-100">{blockedDeployments}</div>
            <p className="text-xs text-rose-600 dark:text-rose-400">needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Assigned Products
          </CardTitle>
          <CardDescription>Products this client has access to</CardDescription>
        </CardHeader>
        <CardContent>
          {assignedProducts.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {assignedProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                    <Package className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    {product.status && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {product.status}
                      </Badge>
                    )}
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No products assigned to this client</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deployments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Deployments
          </CardTitle>
          <CardDescription>All deployments for this client</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deployments?.rows?.map((deployment) => (
                <TableRow key={deployment.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      {deployment.productName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[deployment.status]}>
                      {deployment.status?.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {deployment.environment?.toLowerCase() === "qa"
                      ? "QA"
                      : deployment.environment
                        ? deployment.environment.charAt(0).toUpperCase() + deployment.environment.slice(1)
                        : "-"}
                  </TableCell>
                  <TableCell>{deployment.version || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${deployment.checklistProgress || 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {deployment.checklistProgress || 0}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/deployments/${deployment.id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!deployments?.rows || deployments.rows.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No deployments found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentation
              </CardTitle>
              <CardDescription>Reference documents and links for this client</CardDescription>
            </div>
            {canEdit() && (
              <Dialog open={docDialogOpen} onOpenChange={setDocDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Document
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleAddDoc}>
                    <DialogHeader>
                      <DialogTitle>Add Documentation Link</DialogTitle>
                      <DialogDescription>
                        Add a reference document or link for this client
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="doc-title">Title *</Label>
                        <Input
                          id="doc-title"
                          value={docForm.title}
                          onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                          placeholder="e.g., SOW Document"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="doc-url">URL *</Label>
                        <Input
                          id="doc-url"
                          type="url"
                          value={docForm.url}
                          onChange={(e) => setDocForm({ ...docForm, url: e.target.value })}
                          placeholder="https://..."
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setDocDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={addDocMutation.isPending}>
                        {addDocMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Document
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {client.documentation && client.documentation.length > 0 ? (
            <div className="space-y-2">
              {client.documentation.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                      <LinkIcon className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{doc.url}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </a>
                  {canEdit() && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 flex-shrink-0 text-destructive hover:text-destructive"
                      onClick={() => setDeleteDocDialog({ open: true, doc })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No documentation added yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Client Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{client.name}"? This action cannot be undone.
              {client.deploymentCount > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This client has {client.deploymentCount} deployment(s) associated with it.
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

      {/* Delete Documentation Dialog */}
      <AlertDialog open={deleteDocDialog.open} onOpenChange={(open) => setDeleteDocDialog({ ...deleteDocDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDocDialog.doc?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDoc}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={removeDocMutation.isPending}
            >
              {removeDocMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
