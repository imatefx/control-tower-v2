import { useParams, Link, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { deploymentsAPI, checklistsAPI, checklistTemplatesAPI, productsAPI } from "@/services/api"
import { formatDate, formatDateTime } from "@/utils/dateFormat"
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
import { toast } from "@/hooks/useToast"

export default function DeploymentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { canEdit } = useAuth()
  const [statusChangeDialog, setStatusChangeDialog] = useState(false)
  const [statusChangeNote, setStatusChangeNote] = useState("")
  const [pendingStatus, setPendingStatus] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState(false)

  const { data: deployment, isLoading } = useQuery({
    queryKey: ["deployment", id],
    queryFn: () => deploymentsAPI.get(id),
  })

  const { data: checklistData } = useQuery({
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

  // Create a lookup map from checklist items array (by item name)
  const checklistMap = (checklistData || []).reduce((acc, item) => {
    acc[item.item] = item
    return acc
  }, {})

  // Check if templates match database items
  const templatesMatchData = checklistTemplates?.length > 0 &&
    checklistTemplates.some(t => checklistMap[t.label])

  // Use database items directly if templates don't match, otherwise use templates
  const checklistItems = (checklistData && checklistData.length > 0 && !templatesMatchData)
    ? checklistData.map(item => ({ key: item.item, label: item.item }))
    : (checklistTemplates?.length > 0
        ? checklistTemplates
        : (checklistData || []).map(item => ({ key: item.item, label: item.item })))

  // Check if product is an adapter type
  const isAdapterProduct = product?.isAdapter || false

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, blockedComment }) =>
      deploymentsAPI.updateStatus(id, status, blockedComment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["deployment", id] })
      setBlockedDialog(false)
      setBlockedComment("")
      toast.success(`Status updated to ${variables.status}`)
    },
    onError: () => {
      toast.error("Failed to update status")
    },
  })

  const updateChecklistMutation = useMutation({
    mutationFn: (itemId) => checklistsAPI.toggleItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist", id] })
      queryClient.invalidateQueries({ queryKey: ["deployment", id] })
      toast.success("Checklist item updated")
    },
    onError: () => {
      toast.error("Failed to update checklist")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deploymentsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] })
      toast.success("Deployment deleted successfully")
      navigate("/deployments")
    },
    onError: () => {
      toast.error("Failed to delete deployment")
    },
  })

  const handleDelete = () => {
    deleteMutation.mutate()
  }

  const handleStatusChange = (newStatus) => {
    setPendingStatus(newStatus)
    setStatusChangeNote("")
    setStatusChangeDialog(true)
  }

  const handleStatusChangeSubmit = () => {
    const payload = { status: pendingStatus }
    if (statusChangeNote.trim()) {
      payload.statusNote = statusChangeNote.trim()
    }
    if (pendingStatus === "Blocked") {
      payload.blockedComment = statusChangeNote.trim()
    }
    updateStatusMutation.mutate(payload)
    setStatusChangeDialog(false)
    setStatusChangeNote("")
    setPendingStatus(null)
  }

  const handleChecklistToggle = (itemName) => {
    const checklistItem = checklistMap[itemName]
    if (checklistItem?.id) {
      updateChecklistMutation.mutate(checklistItem.id)
    }
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
  const getDateStatus = (dateStr, status) => {
    if (!dateStr) return null
    const targetDate = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    targetDate.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24))
    // Released deployments are never overdue or urgent
    const isReleased = status === "Released"
    return {
      diffDays,
      isOverdue: !isReleased && diffDays < 0,
      isUrgent: !isReleased && diffDays >= 0 && diffDays <= 3,
      isSoon: !isReleased && diffDays > 3 && diffDays <= 7,
      isReleased,
    }
  }

  const dateStatus = getDateStatus(deployment.nextDeliveryDate, deployment.status)

  // Calculate completed items using the checklist map
  const completedItems = checklistItems.filter((item) => {
    const checklistItem = checklistMap[item.label] || checklistMap[item.key]
    return checklistItem?.isCompleted
  }).length
  const progressPercent = checklistItems.length > 0
    ? Math.round((completedItems / checklistItems.length) * 100)
    : 0

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
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-100 dark:border-blue-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500">
                <Package className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Product</p>
                <Link
                  to={`/products/${deployment.productId}`}
                  className="font-semibold hover:underline text-blue-900 dark:text-blue-100"
                >
                  {deployment.productName}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-100 dark:border-purple-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Client</p>
                <Link
                  to={`/clients/${deployment.clientId}`}
                  className="font-semibold hover:underline text-purple-900 dark:text-purple-100"
                >
                  {deployment.clientName}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border ${
          dateStatus?.isOverdue ? "bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950 dark:to-red-950 border-rose-200 dark:border-rose-800" :
          dateStatus?.isUrgent ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800" :
          dateStatus?.isReleased ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800" :
          "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-emerald-100 dark:border-emerald-800"
        }`}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                dateStatus?.isOverdue ? "bg-rose-500" :
                dateStatus?.isUrgent ? "bg-amber-500" :
                dateStatus?.isReleased ? "bg-green-500" :
                "bg-emerald-500"
              }`}>
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className={`text-xs font-medium ${
                  dateStatus?.isOverdue ? "text-rose-600 dark:text-rose-400" :
                  dateStatus?.isUrgent ? "text-amber-600 dark:text-amber-400" :
                  dateStatus?.isReleased ? "text-green-600 dark:text-green-400" :
                  "text-emerald-600 dark:text-emerald-400"
                }`}>Target Date</p>
                <p className={`font-semibold ${
                  dateStatus?.isOverdue ? "text-rose-900 dark:text-rose-100" :
                  dateStatus?.isUrgent ? "text-amber-900 dark:text-amber-100" :
                  dateStatus?.isReleased ? "text-green-900 dark:text-green-100" :
                  "text-emerald-900 dark:text-emerald-100"
                }`}>
                  {deployment.nextDeliveryDate
                    ? formatDate(deployment.nextDeliveryDate)
                    : "Not set"}
                </p>
                {dateStatus && (
                  <p className={`text-xs ${
                    dateStatus.isOverdue ? "text-rose-500 dark:text-rose-400" :
                    dateStatus.isUrgent ? "text-amber-500 dark:text-amber-400" :
                    dateStatus.isReleased ? "text-green-500 dark:text-green-400" :
                    "text-emerald-500 dark:text-emerald-400"
                  }`}>
                    {dateStatus.isReleased
                      ? "Completed"
                      : dateStatus.isOverdue
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

        <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 border-slate-100 dark:border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-500">
                <User className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Delivery Person</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {deployment.deliveryPerson || "Not assigned"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-950 dark:to-sky-950 border-cyan-100 dark:border-cyan-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">Type / Env</p>
                <div className="flex flex-wrap items-center gap-1 mt-0.5">
                  <Badge variant="outline" className="text-xs capitalize">
                    {deployment.deploymentType?.replace("-", " ") || "GA"}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {deployment.environment || "-"}
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
                      {comment.author} • {formatDate(comment.timestamp)}
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
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {completedItems}/{checklistItems.length} ({progressPercent}%)
                  </span>
                </div>

                <div className="space-y-2">
                  {checklistItems.map((item, index) => {
                    const checklistItem = checklistMap[item.label] || checklistMap[item.key]
                    const isCompleted = checklistItem?.isCompleted || false
                    return (
                      <div
                        key={item.key || item.label}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                          isCompleted
                            ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800"
                            : "bg-background border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <Checkbox
                          id={item.key || item.label}
                          checked={isCompleted}
                          onCheckedChange={() =>
                            canEdit() && checklistItem?.id && handleChecklistToggle(item.label || item.key)
                          }
                          disabled={!canEdit() || updateChecklistMutation.isPending}
                          className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                        />
                        <Label
                          htmlFor={item.key || item.label}
                          className={`flex-1 cursor-pointer font-normal ${
                            isCompleted ? "text-emerald-700" : ""
                          }`}
                        >
                          <span className="text-muted-foreground mr-2">{index + 1}.</span>
                          {item.label}
                        </Label>
                        {isCompleted && (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        )}
                      </div>
                    )
                  })}
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
                  <div className="p-3 rounded-lg bg-muted">
                    <Label className="text-xs text-muted-foreground">Created</Label>
                    <p className="font-medium">
                      {formatDate(deployment.createdAt)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <Label className="text-xs text-muted-foreground">Last Updated</Label>
                    <p className="font-medium">
                      {formatDate(deployment.updatedAt)}
                    </p>
                  </div>
                </div>

                {deployment.releaseItems && (
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-800">
                    <Label className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      <Tag className="h-3 w-3" />
                      Release Items / Scope
                    </Label>
                    <p className="text-sm mt-1 text-blue-900 dark:text-blue-100">{deployment.releaseItems}</p>
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
                            return <p className="text-sm bg-muted p-3 rounded-lg border">{deployment.notes}</p>
                          }
                        }
                        if (Array.isArray(notesArray)) {
                          return notesArray.map((note, idx) => (
                            <div key={note.id || idx} className="text-sm bg-muted p-3 rounded-lg border">
                              <p>{note.text}</p>
                              <div className="text-xs text-muted-foreground mt-1">
                                {note.author} • {formatDate(note.timestamp)}
                              </div>
                            </div>
                          ))
                        }
                        return <p className="text-sm bg-muted p-3 rounded-lg border">{String(deployment.notes)}</p>
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
                    ? "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800"
                    : "bg-muted border-border"
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${deployment.documentation?.runbook ? "bg-blue-500" : "bg-muted-foreground/50"}`}>
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">Runbook</span>
                  </div>
                  {deployment.documentation?.runbook ? (
                    <a
                      href={deployment.documentation.runbook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Document
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not uploaded</p>
                  )}
                </div>

                {/* Release Notes */}
                <div className={`p-4 rounded-lg border-2 ${
                  deployment.documentation?.releaseNotesLink
                    ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800"
                    : "bg-muted border-border"
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${deployment.documentation?.releaseNotesLink ? "bg-emerald-500" : "bg-muted-foreground/50"}`}>
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">Release Notes</span>
                  </div>
                  {deployment.documentation?.releaseNotesLink ? (
                    <a
                      href={deployment.documentation.releaseNotesLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Document
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not uploaded</p>
                  )}
                </div>

                {/* QA Report */}
                <div className={`p-4 rounded-lg border-2 ${
                  deployment.documentation?.qaReport
                    ? "bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800"
                    : "bg-muted border-border"
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${deployment.documentation?.qaReport ? "bg-purple-500" : "bg-muted-foreground/50"}`}>
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">QA Report</span>
                  </div>
                  {deployment.documentation?.qaReport ? (
                    <a
                      href={deployment.documentation.qaReport}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Document
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not uploaded</p>
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
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm"
                      >
                        <ExternalLink className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                        <span className="text-blue-600 dark:text-blue-400 truncate">{docUrl}</span>
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
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-4">
                    {deployment.statusHistory.slice().reverse().map((entry, idx) => {
                      const toStatusConfig = statusColors[entry.toStatus] || "secondary"
                      return (
                        <div key={entry.id || idx} className="relative pl-10">
                          <div className="absolute left-2.5 w-3 h-3 rounded-full bg-background border-2 border-blue-500" />
                          <div className="bg-muted rounded-lg p-3 border">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={statusColors[entry.fromStatus] || "secondary"} className="text-xs">
                                {entry.fromStatus}
                              </Badge>
                              <span className="text-muted-foreground">→</span>
                              <Badge variant={toStatusConfig} className="text-xs">
                                {entry.toStatus}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{entry.text}</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              {entry.author} • {formatDateTime(entry.timestamp)}
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

      <Dialog open={statusChangeDialog} onOpenChange={setStatusChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Status to "{pendingStatus}"</DialogTitle>
            <DialogDescription>
              {pendingStatus === "Blocked"
                ? "Please provide a reason for blocking this deployment"
                : "Add a note for this status change (optional)"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="statusChangeNote">
                {pendingStatus === "Blocked" ? "Reason *" : "Note"}
              </Label>
              <Textarea
                id="statusChangeNote"
                value={statusChangeNote}
                onChange={(e) => setStatusChangeNote(e.target.value)}
                placeholder={
                  pendingStatus === "Blocked"
                    ? "Describe why this deployment is blocked..."
                    : "Add any relevant notes about this status change..."
                }
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusChangeDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={pendingStatus === "Blocked" ? "destructive" : "default"}
              onClick={handleStatusChangeSubmit}
              disabled={(pendingStatus === "Blocked" && !statusChangeNote.trim()) || updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Change to {pendingStatus}
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
