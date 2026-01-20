import { useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { productsAPI, deploymentsAPI } from "@/services/api"
import { toast } from "@/hooks/useToast"
import { formatDate } from "@/utils/dateFormat"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  ArrowLeft,
  Package,
  Rocket,
  Users,
  ExternalLink,
  Loader2,
  Pencil,
  Trash2,
  FlaskConical,
  Calendar,
  FileText,
  Link as LinkIcon,
  User,
  Mail,
  Settings2,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import DocumentationList from "@/components/DocumentationList"

const formatStatus = (status) => {
  if (!status) return "Not Started"
  return status.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { canEdit } = useAuth()
  const [deleteDialog, setDeleteDialog] = useState(false)

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsAPI.get(id),
  })

  const { data: deployments } = useQuery({
    queryKey: ["deployments", "product", id, "with-children"],
    queryFn: () => deploymentsAPI.getByProductWithChildren(id),
  })

  const { data: childProducts } = useQuery({
    queryKey: ["products", "children", id],
    queryFn: () => productsAPI.getChildren(id),
  })

  const deleteMutation = useMutation({
    mutationFn: () => productsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Product deleted successfully")
      navigate("/products")
    },
    onError: () => {
      toast.error("Failed to delete product")
    },
  })

  // Documentation mutations
  const addDocMutation = useMutation({
    mutationFn: ({ title, url }) => productsAPI.addDocumentation(id, { title, url }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", id] })
      toast.success("Document added successfully")
    },
    onError: () => {
      toast.error("Failed to add document")
    },
  })

  const removeDocMutation = useMutation({
    mutationFn: (docId) => productsAPI.removeDocumentation(id, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", id] })
      toast.success("Document removed successfully")
    },
    onError: () => {
      toast.error("Failed to remove document")
    },
  })

  const handleDelete = () => {
    deleteMutation.mutate()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Product not found</p>
        <Button asChild className="mt-4">
          <Link to="/products">Back to Products</Link>
        </Button>
      </div>
    )
  }

  const statusColors = {
    not_started: "secondary",
    in_progress: "info",
    blocked: "destructive",
    completed: "success",
  }

  const eap = product.eap || {}
  const isEapActive = eap.isActive
  const documentation = product.documentation || {}
  const relevantDocs = product.relevantDocs || {}
  const adapterServices = product.adapterServices || {}
  const children = childProducts?.children || []

  const docTypes = [
    { key: "productGuide", label: "Product Guide" },
    { key: "releaseNotes", label: "Release Notes" },
    { key: "demoScript", label: "Demo Script" },
    { key: "testCases", label: "Test Cases" },
    { key: "productionChecklist", label: "Production Checklist" },
  ]

  const adapterServiceTypes = [
    { key: "hasEquipmentSA", label: "Equipment - Service Assurance" },
    { key: "hasEquipmentSE", label: "Equipment - Service Enablement" },
    { key: "hasMappingService", label: "Mapping Service" },
    { key: "hasConstructionService", label: "Construction Service" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <p className="text-muted-foreground">{product.description || "No description"}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEapActive && (
            <Badge variant="purple" className="gap-1">
              <FlaskConical className="h-3 w-3" />
              EAP Active
            </Badge>
          )}
          {product.isAdapter && (
            <Badge variant="indigo" className="gap-1">
              <Settings2 className="h-3 w-3" />
              Adapter
            </Badge>
          )}
          {canEdit() && (
            <>
              <Button variant="outline" size="icon" asChild>
                <Link to={`/products/${id}/edit`}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="icon" onClick={() => setDeleteDialog(true)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Product Owner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold">{product.productOwner || "Not assigned"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Engineering Owner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold">{product.engineeringOwner || "Not assigned"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Next Release
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold">
              {product.nextReleaseDate
                ? formatDate(product.nextReleaseDate)
                : "Not scheduled"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              Deployments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{product.deploymentCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Releases - Next 30 days */}
      {(() => {
        const upcomingDeployments = (deployments?.rows || []).filter(d => {
          if (!d.nextDeliveryDate || d.status === "Released") return false
          const deliveryDate = new Date(d.nextDeliveryDate)
          const today = new Date()
          const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
          return deliveryDate >= today && deliveryDate <= thirtyDaysLater
        }).sort((a, b) => new Date(a.nextDeliveryDate) - new Date(b.nextDeliveryDate))

        if (upcomingDeployments.length === 0) return null

        return (
          <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Calendar className="h-5 w-5" />
                Upcoming Releases (Next 30 Days)
              </CardTitle>
              <CardDescription>{upcomingDeployments.length} deployment{upcomingDeployments.length !== 1 ? "s" : ""} scheduled</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingDeployments.slice(0, 5).map(dep => (
                  <Link key={dep.id} to={`/deployments/${dep.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-800 border hover:border-blue-300 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <div>
                          <div className="font-medium text-sm">{dep.clientName}</div>
                          <div className="text-xs text-muted-foreground">{dep.featureName || dep.environment}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {formatDate(dep.nextDeliveryDate)}
                      </Badge>
                    </div>
                  </Link>
                ))}
                {upcomingDeployments.length > 5 && (
                  <div className="text-sm text-muted-foreground text-center">
                    +{upcomingDeployments.length - 5} more upcoming
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })()}

      {/* EAP Section */}
      {isEapActive && (
        <Card className="border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <FlaskConical className="h-5 w-5" />
              Early Access Program (EAP)
            </CardTitle>
            <CardDescription>This product is currently in EAP</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="text-sm text-muted-foreground">Jira Board</div>
              {eap.jiraBoardUrl ? (
                <a
                  href={eap.jiraBoardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline flex items-center gap-1"
                >
                  Open Board <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <div className="text-muted-foreground">Not configured</div>
              )}
            </div>
            {eap.clients && eap.clients.length > 0 && (
              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground mb-3">EAP Clients</div>
                <div className="space-y-3">
                  {eap.clients.map((client, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-800 border">
                      <div className="font-medium">{client.clientName || client.clientId}</div>
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Start: </span>
                          <span className="font-medium">{client.startDate ? formatDate(client.startDate) : "-"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">End: </span>
                          <span className="font-medium">{client.endDate ? formatDate(client.endDate) : "-"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Backward compatibility for old clientIds format */}
            {(!eap.clients || eap.clients.length === 0) && eap.clientIds && eap.clientIds.length > 0 && (
              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground mb-2">EAP Clients</div>
                <div className="flex flex-wrap gap-2">
                  {eap.clientIds.map((clientId, i) => (
                    <Badge key={i} variant="secondary">{clientId}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Adapter Services */}
      {product.isAdapter && (
        <Card className="border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
              <Settings2 className="h-5 w-5" />
              Adapter Services
            </CardTitle>
            <CardDescription>Supported adapter services for this product</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {adapterServiceTypes.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  {adapterServices[key] ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-slate-400" />
                  )}
                  <span className={adapterServices[key] ? "font-medium" : "text-muted-foreground"}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parent Product */}
      {product.parentId && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Parent Product</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              to={`/products/${product.parentId}`}
              className="text-primary hover:underline font-medium flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              {product.parentName || "View Parent"}
            </Link>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="deployments">
        <TabsList>
          <TabsTrigger value="deployments">
            <Rocket className="mr-2 h-4 w-4" />
            Deployments
          </TabsTrigger>
          {children.length > 0 && (
            <TabsTrigger value="subproducts">
              <Package className="mr-2 h-4 w-4" />
              Sub Products ({children.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="documentation">
            <FileText className="mr-2 h-4 w-4" />
            Documentation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deployments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployments</CardTitle>
              <CardDescription>All deployments for this product</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Environment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Target Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deployments?.rows?.map((deployment) => (
                    <TableRow key={deployment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {deployment.clientName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[deployment.status]}>
                          {formatStatus(deployment.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {deployment.environment?.toUpperCase() || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {deployment.deploymentType?.toUpperCase() || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {deployment.nextDeliveryDate
                          ? formatDate(deployment.nextDeliveryDate)
                          : "-"}
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
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        <Rocket className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        No deployments found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {children.length > 0 && (
          <TabsContent value="subproducts" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Sub Products</CardTitle>
                <CardDescription>Child products under this main product</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Product Owner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {children.map((subProduct) => (
                      <TableRow key={subProduct.id}>
                        <TableCell className="font-medium">{subProduct.name}</TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate">
                          {subProduct.description || "-"}
                        </TableCell>
                        <TableCell>{subProduct.productOwner || "-"}</TableCell>
                        <TableCell>
                          {subProduct.eap?.isActive ? (
                            <Badge variant="purple">EAP</Badge>
                          ) : (
                            <Badge variant="success">GA</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/products/${subProduct.id}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="documentation" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentation</CardTitle>
              <CardDescription>Product documentation links and resources</CardDescription>
            </CardHeader>
            <CardContent>
              {/* New flexible format - uses DocumentationList */}
              {Array.isArray(documentation) ? (
                <DocumentationList
                  documents={documentation}
                  onAdd={canEdit() ? (title, url) => addDocMutation.mutate({ title, url }) : undefined}
                  onRemove={canEdit() ? (docId) => removeDocMutation.mutate(docId) : undefined}
                  editable={canEdit()}
                  isAddPending={addDocMutation.isPending}
                  isRemovePending={removeDocMutation.isPending}
                  emptyMessage="No documentation added for this product yet"
                />
              ) : (
                /* Legacy format - display old hardcoded doc types */
                <div className="space-y-4">
                  {docTypes.map(({ key, label }) => {
                    const isRelevant = relevantDocs[key] !== false
                    const hasDoc = documentation[key]
                    return (
                      <div
                        key={key}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          !isRelevant ? "bg-muted/50 opacity-60" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className={`h-5 w-5 ${hasDoc ? "text-emerald-500" : "text-muted-foreground"}`} />
                          <div>
                            <div className="font-medium">{label}</div>
                            {!isRelevant && (
                              <div className="text-xs text-muted-foreground">Not applicable</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasDoc ? (
                            <a
                              href={hasDoc}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <LinkIcon className="h-4 w-4" />
                              View
                            </a>
                          ) : isRelevant ? (
                            <Badge variant="destructive-soft" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Missing
                            </Badge>
                          ) : (
                            <Badge variant="secondary">N/A</Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {canEdit() && (
                    <p className="text-sm text-muted-foreground mt-4 pt-4 border-t">
                      To manage documentation, <Link to={`/products/${id}/edit`} className="text-primary hover:underline">edit this product</Link> to migrate to the new flexible format.
                    </p>
                  )}
                </div>
              )}

              {/* Notification Emails */}
              {product.notificationEmails && product.notificationEmails.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center gap-2 mb-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Notification Emails</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.notificationEmails.map((email, i) => (
                      <Badge key={i} variant="outline">{email}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{product.name}"? This action cannot be undone.
              {product.deploymentCount > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This product has {product.deploymentCount} deployment(s) associated with it.
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
