import { useParams, Link, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { deploymentsAPI, checklistsAPI, checklistTemplatesAPI, productsAPI } from "@/services/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  ArrowLeft,
  Rocket,
  Package,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  MessageSquare,
  Pencil,
  Trash2,
  Calendar,
  User,
  FileText,
  Link as LinkIcon,
  ExternalLink,
  Zap,
  Server,
  MapPin,
  Wrench,
  History,
  Tag,
  XCircle,
  PlayCircle,
  CircleDot,
} from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"

export default function DeploymentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { canEdit } = useAuth()
  const [blockedDialog, setBlockedDialog] = useState(false)
  const [blockedComment, setBlockedComment] = useState("")
  const [deleteDialog, setDeleteDialog] = useState(false)

  const { data: deployment, isLoading } = useQuery({
    queryKey: ["deployment", id],
    queryFn: () => deploymentsAPI.get(id),
  })

  const { data: checklist } = useQuery({
    queryKey: ["checklist", id],
    queryFn: () => checklistsAPI.getByDeployment(id),
  })

  const { data: checklistTemplates } = useQuery({
    queryKey: ["checklist-templates-active"],
    queryFn: () => checklistTemplatesAPI.getActive(),
  })

  // Fetch product data to check if it's an adapter
  const { data: product } = useQuery({
    queryKey: ["product", deployment?.productId],
    queryFn: () => productsAPI.get(deployment?.productId),
    enabled: !!deployment?.productId,
  })

  // Use dynamic checklist items from templates
  const checklistItems = checklistTemplates || []

  // Check if product is an adapter type
  const isAdapterProduct = product?.isAdapter || false

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, blockedComment }) =>
      deploymentsAPI.updateStatus(id, status, blockedComment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deployment", id] })
      setBlockedDialog(false)
      setBlockedComment("")
    },
  })

  const updateChecklistMutation = useMutation({
    mutationFn: ({ itemKey, completed }) =>
      checklistsAPI.updateItem(checklist?.id, itemKey, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist", id] })
      queryClient.invalidateQueries({ queryKey: ["deployment", id] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deploymentsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] })
      navigate("/deployments")
    },
  })

  const handleDelete = () => {
    deleteMutation.mutate()
  }

  const handleStatusChange = (newStatus) => {
    if (newStatus === "blocked") {
      setBlockedDialog(true)
    } else {
      updateStatusMutation.mutate({ status: newStatus })
    }
  }

  const handleBlockedSubmit = () => {
    updateStatusMutation.mutate({ status: "blocked", blockedComment })
  }

  const handleChecklistToggle = (itemKey, currentValue) => {
    updateChecklistMutation.mutate({ itemKey, completed: !currentValue })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!deployment) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Deployment not found</p>
        <Button asChild className="mt-4">
          <Link to="/deployments">Back to Deployments</Link>
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

  const statusIcons = {
    not_started: Clock,
    "Not Started": Clock,
    in_progress: PlayCircle,
    "In Progress": PlayCircle,
    blocked: AlertTriangle,
    "Blocked": AlertTriangle,
    completed: CheckCircle,
    "Released": CheckCircle,
  }

  const StatusIcon = statusIcons[deployment.status] || Clock

  // Adapter service status colors and icons
  const adapterStatusConfig = {
    not_started: { color: "bg-slate-100 text-slate-600", icon: CircleDot, label: "Not Started" },
    in_progress: { color: "bg-blue-100 text-blue-700", icon: PlayCircle, label: "In Progress" },
    completed: { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle, label: "Completed" },
    blocked: { color: "bg-rose-100 text-rose-700", icon: XCircle, label: "Blocked" },
  }

  const getAdapterStatusConfig = (status) => {
    return adapterStatusConfig[status] || adapterStatusConfig.not_started
  }

  // Calculate days until/since target date
  const getDateStatus = (dateStr) => {
    if (!dateStr) return null
    const targetDate = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    targetDate.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24))
    return {
      diffDays,
      isOverdue: diffDays < 0,
      isUrgent: diffDays >= 0 && diffDays <= 3,
      isSoon: diffDays > 3 && diffDays <= 7,
    }
  }

  const dateStatus = getDateStatus(deployment.nextDeliveryDate)

  const completedItems = checklist
    ? checklistItems.filter((item) => checklist[item.key]).length
    : 0
  const progressPercent = Math.round((completedItems / checklistItems.length) * 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/deployments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <Rocket className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{deployment.productName}</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                {deployment.clientName}
                {deployment.featureName && (
                  <>
                    <span className="text-slate-300">•</span>
                    <Tag className="h-4 w-4" />
                    {deployment.featureName}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
        <Badge variant={statusColors[deployment.status]} className="gap-1 text-sm px-3 py-1">
          <StatusIcon className="h-4 w-4" />
          {deployment.status?.replace("_", " ")}
        </Badge>
        {canEdit() && (
          <div className="flex items-center gap-2">
            <Select value={deployment.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Blocked">Blocked</SelectItem>
                <SelectItem value="Released">Released</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" asChild>
              <Link to={`/deployments/${id}/edit`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="icon" onClick={() => setDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      </div>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500">
                <Package className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">Product</p>
                <Link
                  to={`/products/${deployment.productId}`}
                  className="font-semibold hover:underline text-blue-900"
                >
                  {deployment.productName}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-purple-600 font-medium">Client</p>
                <Link
                  to={`/clients/${deployment.clientId}`}
                  className="font-semibold hover:underline text-purple-900"
                >
                  {deployment.clientName}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border ${
          dateStatus?.isOverdue ? "bg-gradient-to-br from-rose-50 to-red-50 border-rose-200" :
          dateStatus?.isUrgent ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200" :
          "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100"
        }`}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                dateStatus?.isOverdue ? "bg-rose-500" :
                dateStatus?.isUrgent ? "bg-amber-500" :
                "bg-emerald-500"
              }`}>
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className={`text-xs font-medium ${
                  dateStatus?.isOverdue ? "text-rose-600" :
                  dateStatus?.isUrgent ? "text-amber-600" :
                  "text-emerald-600"
                }`}>Target Date</p>
                <p className={`font-semibold ${
                  dateStatus?.isOverdue ? "text-rose-900" :
                  dateStatus?.isUrgent ? "text-amber-900" :
                  "text-emerald-900"
                }`}>
                  {deployment.nextDeliveryDate
                    ? new Date(deployment.nextDeliveryDate).toLocaleDateString()
                    : "Not set"}
                </p>
                {dateStatus && (
                  <p className={`text-xs ${
                    dateStatus.isOverdue ? "text-rose-500" :
                    dateStatus.isUrgent ? "text-amber-500" :
                    "text-emerald-500"
                  }`}>
                    {dateStatus.isOverdue
                      ? `${Math.abs(dateStatus.diffDays)} days overdue`
                      : dateStatus.diffDays === 0
                        ? "Due today"
                        : `${dateStatus.diffDays} days left`}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-slate-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-500">
                <User className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-600 font-medium">Delivery Person</p>
                <p className="font-semibold text-slate-900">
                  {deployment.deliveryPerson || "Not assigned"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-50 to-sky-50 border-cyan-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-cyan-600 font-medium">Type / Env</p>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    {deployment.deploymentType?.toUpperCase() || "GA"}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {deployment.environment?.toUpperCase() || "-"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Blocked Alert */}
      {(deployment.status === "blocked" || deployment.status === "Blocked") && (
        <Card className="border-rose-300 bg-gradient-to-br from-rose-50 to-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="h-5 w-5" />
              Deployment Blocked
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deployment.blockedComment && (
              <p className="text-sm text-rose-800 bg-rose-100 p-3 rounded-lg">{deployment.blockedComment}</p>
            )}
            {deployment.blockedComments && deployment.blockedComments.length > 0 && (
              <div className="space-y-2 mt-2">
                {deployment.blockedComments.map((comment, idx) => (
                  <div key={comment.id || idx} className="text-sm bg-rose-100 p-3 rounded-lg">
                    <p className="text-rose-800">{comment.text}</p>
                    <div className="text-xs text-rose-500 mt-1">
                      {comment.author} • {new Date(comment.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="checklist" className="space-y-4">
        <TabsList>
          <TabsTrigger value="checklist" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Checklist
          </TabsTrigger>
          {isAdapterProduct && (
            <TabsTrigger value="adapter" className="gap-2">
              <Server className="h-4 w-4" />
              Adapter Services
            </TabsTrigger>
          )}
          <TabsTrigger value="documentation" className="gap-2">
            <FileText className="h-4 w-4" />
            Documentation
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Checklist Tab */}
        <TabsContent value="checklist">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  Deployment Checklist
                </CardTitle>
                <CardDescription>
                  Track progress through the deployment checklist
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">
                    {completedItems}/{checklistItems.length} ({progressPercent}%)
                  </span>
                </div>

                <div className="space-y-2">
                  {checklistItems.map((item, index) => (
                    <div
                      key={item.key}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        checklist?.[item.key]
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <Checkbox
                        id={item.key}
                        checked={checklist?.[item.key] || false}
                        onCheckedChange={() =>
                          canEdit() && handleChecklistToggle(item.key, checklist?.[item.key])
                        }
                        disabled={!canEdit() || updateChecklistMutation.isPending}
                        className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                      />
                      <Label
                        htmlFor={item.key}
                        className={`flex-1 cursor-pointer font-normal ${
                          checklist?.[item.key] ? "text-emerald-700" : ""
                        }`}
                      >
                        <span className="text-muted-foreground mr-2">{index + 1}.</span>
                        {item.label}
                      </Label>
                      {checklist?.[item.key] && (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  Deployment Details
                </CardTitle>
                <CardDescription>Additional information about this deployment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-slate-50">
                    <Label className="text-xs text-muted-foreground">Created</Label>
                    <p className="font-medium">
                      {new Date(deployment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50">
                    <Label className="text-xs text-muted-foreground">Last Updated</Label>
                    <p className="font-medium">
                      {new Date(deployment.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {deployment.releaseItems && (
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                    <Label className="text-xs text-blue-600 flex items-center gap-2">
                      <Tag className="h-3 w-3" />
                      Release Items / Scope
                    </Label>
                    <p className="text-sm mt-1 text-blue-900">{deployment.releaseItems}</p>
                  </div>
                )}

                {deployment.notes && (
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4" />
                      Notes
                    </Label>
                    <div className="space-y-2">
                      {(() => {
                        let notesArray = deployment.notes
                        if (typeof notesArray === "string") {
                          try {
                            notesArray = JSON.parse(notesArray)
                          } catch {
                            return <p className="text-sm bg-slate-50 p-3 rounded-lg border">{deployment.notes}</p>
                          }
                        }
                        if (Array.isArray(notesArray)) {
                          return notesArray.map((note, idx) => (
                            <div key={note.id || idx} className="text-sm bg-slate-50 p-3 rounded-lg border">
                              <p>{note.text}</p>
                              <div className="text-xs text-muted-foreground mt-1">
                                {note.author} • {new Date(note.timestamp).toLocaleDateString()}
                              </div>
                            </div>
                          ))
                        }
                        return <p className="text-sm bg-slate-50 p-3 rounded-lg border">{String(deployment.notes)}</p>
                      })()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Adapter Services Tab */}
        {isAdapterProduct && (
          <TabsContent value="adapter">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-indigo-500" />
                  Adapter Services Status
                </CardTitle>
                <CardDescription>
                  Track the status of each adapter service component
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { key: "equipmentSAStatus", label: "Equipment SA", icon: Server, description: "Equipment Service Account" },
                    { key: "equipmentSEStatus", label: "Equipment SE", icon: Wrench, description: "Equipment Service Endpoint" },
                    { key: "mappingStatus", label: "Mapping Service", icon: MapPin, description: "Data mapping configuration" },
                    { key: "constructionStatus", label: "Construction Service", icon: Wrench, description: "Construction data integration" },
                  ].map((service) => {
                    const status = deployment[service.key] || "not_started"
                    const config = getAdapterStatusConfig(status)
                    const StatusIconComponent = config.icon
                    return (
                      <div
                        key={service.key}
                        className={`p-4 rounded-lg border-2 transition-all ${config.color}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <service.icon className="h-5 w-5" />
                            <div>
                              <p className="font-semibold">{service.label}</p>
                              <p className="text-xs opacity-75">{service.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusIconComponent className="h-5 w-5" />
                            <span className="text-sm font-medium">{config.label}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Documentation Tab */}
        <TabsContent value="documentation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-500" />
                Documentation
              </CardTitle>
              <CardDescription>
                Access deployment documentation and resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {/* Runbook */}
                <div className={`p-4 rounded-lg border-2 ${
                  deployment.documentation?.runbook
                    ? "bg-blue-50 border-blue-200"
                    : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${deployment.documentation?.runbook ? "bg-blue-500" : "bg-slate-400"}`}>
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">Runbook</span>
                  </div>
                  {deployment.documentation?.runbook ? (
                    <a
                      href={deployment.documentation.runbook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Document
                    </a>
                  ) : (
                    <p className="text-sm text-slate-400">Not uploaded</p>
                  )}
                </div>

                {/* Release Notes */}
                <div className={`p-4 rounded-lg border-2 ${
                  deployment.documentation?.releaseNotesLink
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${deployment.documentation?.releaseNotesLink ? "bg-emerald-500" : "bg-slate-400"}`}>
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">Release Notes</span>
                  </div>
                  {deployment.documentation?.releaseNotesLink ? (
                    <a
                      href={deployment.documentation.releaseNotesLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Document
                    </a>
                  ) : (
                    <p className="text-sm text-slate-400">Not uploaded</p>
                  )}
                </div>

                {/* QA Report */}
                <div className={`p-4 rounded-lg border-2 ${
                  deployment.documentation?.qaReport
                    ? "bg-purple-50 border-purple-200"
                    : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${deployment.documentation?.qaReport ? "bg-purple-500" : "bg-slate-400"}`}>
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">QA Report</span>
                  </div>
                  {deployment.documentation?.qaReport ? (
                    <a
                      href={deployment.documentation.qaReport}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Document
                    </a>
                  ) : (
                    <p className="text-sm text-slate-400">Not uploaded</p>
                  )}
                </div>
              </div>

              {/* Relevant Docs */}
              {deployment.relevantDocs && deployment.relevantDocs.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <LinkIcon className="h-4 w-4" />
                    Additional Documents
                  </h4>
                  <div className="space-y-2">
                    {deployment.relevantDocs.map((docUrl, idx) => (
                      <a
                        key={idx}
                        href={docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-sm"
                      >
                        <ExternalLink className="h-4 w-4 text-blue-500" />
                        <span className="text-blue-600 truncate">{docUrl}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-slate-500" />
                Status History
              </CardTitle>
              <CardDescription>
                Track all status changes for this deployment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deployment.statusHistory && deployment.statusHistory.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
                  <div className="space-y-4">
                    {deployment.statusHistory.slice().reverse().map((entry, idx) => {
                      const toStatusConfig = statusColors[entry.toStatus] || "secondary"
                      return (
                        <div key={entry.id || idx} className="relative pl-10">
                          <div className="absolute left-2.5 w-3 h-3 rounded-full bg-white border-2 border-blue-500" />
                          <div className="bg-slate-50 rounded-lg p-3 border">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={statusColors[entry.fromStatus] || "secondary"} className="text-xs">
                                {entry.fromStatus}
                              </Badge>
                              <span className="text-slate-400">→</span>
                              <Badge variant={toStatusConfig} className="text-xs">
                                {entry.toStatus}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600">{entry.text}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {entry.author} • {new Date(entry.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No status changes recorded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={blockedDialog} onOpenChange={setBlockedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Blocked</DialogTitle>
            <DialogDescription>
              Please provide a reason for blocking this deployment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="blockedComment">Reason</Label>
              <Textarea
                id="blockedComment"
                value={blockedComment}
                onChange={(e) => setBlockedComment(e.target.value)}
                placeholder="Describe why this deployment is blocked..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockedDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlockedSubmit}
              disabled={!blockedComment.trim() || updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Mark as Blocked
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deployment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this deployment for "{deployment.productName}" - "{deployment.clientName}"? This action cannot be undone.
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
