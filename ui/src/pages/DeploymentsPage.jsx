import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { deploymentsAPI, productsAPI, clientsAPI } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Card, CardContent } from "@/components/ui/card"
import {
  Plus,
  Search,
  ExternalLink,
  Loader2,
  List,
  LayoutGrid,
  MoreHorizontal,
  Pencil,
  Trash2,
  Rocket,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
  Calendar,
  Users,
  Package,
  GanttChartSquare,
  ChevronRight,
  User,
  ArrowRight,
  FlaskConical,
  Zap,
  Building,
  Mail,
  X,
  Bell,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Gantt, ViewMode } from "gantt-task-react"
import "gantt-task-react/dist/index.css"

const environments = ["production", "sandbox", "qa"]
const statuses = ["not_started", "in_progress", "blocked", "completed"]
const deploymentTypes = [
  { value: "ga", label: "GA Release", icon: Rocket, color: "emerald", description: "General availability release to all clients" },
  { value: "eap", label: "EAP Release", icon: FlaskConical, color: "purple", description: "Early access program for selected clients" },
  { value: "feature-release", label: "Feature Release", icon: Zap, color: "blue", description: "New feature rollout" },
  { value: "client-specific", label: "Client Specific", icon: Building, color: "amber", description: "Custom deployment for specific client" },
]

const formatEnvironment = (env) => {
  if (!env) return "-"
  if (env.toLowerCase() === "qa") return "QA"
  return env.charAt(0).toUpperCase() + env.slice(1)
}

const formatDeploymentType = (type) => {
  if (!type) return "-"
  const typeObj = deploymentTypes.find(t => t.value === type)
  return typeObj?.label || type.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
}

const formatStatus = (status) => {
  if (!status) return "Not Started"
  return status.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
}

function getDaysUntil(dateStr) {
  if (!dateStr) return null
  const target = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}

// Deployment Card Component
function DeploymentCard({ deployment, onEdit, onDelete, canEdit }) {
  const targetDate = deployment.nextDeliveryDate || deployment.targetDate
  const days = getDaysUntil(targetDate)
  const isOverdue = days !== null && days < 0
  const isUrgent = days !== null && days >= 0 && days <= 7

  const typeConfig = {
    ga: { color: "emerald", icon: Rocket },
    eap: { color: "purple", icon: FlaskConical },
    "feature-release": { color: "blue", icon: Zap },
    "client-specific": { color: "amber", icon: Building },
  }

  const config = typeConfig[deployment.deploymentType] || typeConfig.ga
  const TypeIcon = config.icon

  const statusColors = {
    "Not Started": "bg-slate-100 text-slate-700",
    not_started: "bg-slate-100 text-slate-700",
    "In Progress": "bg-blue-100 text-blue-700",
    in_progress: "bg-blue-100 text-blue-700",
    "Blocked": "bg-rose-100 text-rose-700",
    blocked: "bg-rose-100 text-rose-700",
    "Released": "bg-emerald-100 text-emerald-700",
    completed: "bg-emerald-100 text-emerald-700",
  }

  const gradientColors = {
    emerald: "from-emerald-500 to-green-500",
    purple: "from-purple-500 to-pink-500",
    blue: "from-blue-500 to-indigo-500",
    amber: "from-amber-500 to-orange-500",
  }

  // Get client display
  const clientDisplay = deployment.clientNames?.length > 1
    ? `${deployment.clientNames[0]} +${deployment.clientNames.length - 1}`
    : deployment.clientName || "No client"

  return (
    <Card className={`group hover:shadow-lg transition-all duration-200 overflow-hidden ${
      isOverdue ? "ring-2 ring-rose-500/50" : isUrgent ? "ring-2 ring-amber-500/50" : ""
    }`}>
      <div className={`h-1.5 bg-gradient-to-r ${gradientColors[config.color]}`} />
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-2">
          <Link to={`/deployments/${deployment.id}`} className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-lg bg-${config.color}-100`}>
                <TypeIcon className={`h-4 w-4 text-${config.color}-600`} />
              </div>
              <h3 className="font-semibold text-base hover:text-primary transition-colors line-clamp-1">
                {deployment.productName}
              </h3>
            </div>
          </Link>
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(deployment)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(deployment)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Client */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <Users className="h-3.5 w-3.5" />
          <span className="truncate">{clientDisplay}</span>
        </div>

        {/* Tags Row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[deployment.status] || statusColors.not_started}`}>
            {formatStatus(deployment.status)}
          </span>
          <Badge variant="outline" className="text-xs">
            {formatEnvironment(deployment.environment)}
          </Badge>
        </div>

        {/* Progress */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Checklist Progress</span>
            <span className="font-medium">{deployment.checklistProgress || 0}%</span>
          </div>
          <Progress value={deployment.checklistProgress || 0} className="h-1.5" />
        </div>

        {/* Owner */}
        {deployment.ownerName && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <User className="h-3 w-3 text-cyan-500" />
            <span>Owner: {deployment.ownerName}</span>
          </div>
        )}

        {/* Target Date */}
        {targetDate && (
          <div className={`flex items-center gap-1.5 text-xs mb-3 ${
            isOverdue ? "text-rose-600" : isUrgent ? "text-amber-600" : "text-muted-foreground"
          }`}>
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {isOverdue
                ? `${Math.abs(days)}d overdue`
                : days === 0
                ? "Due today"
                : `${days}d remaining`}
            </span>
            {(isOverdue || isUrgent) && (
              <span className={`w-1.5 h-1.5 rounded-full ${isOverdue ? "bg-rose-500" : "bg-amber-500"} animate-pulse`} />
            )}
          </div>
        )}

        {/* View Details */}
        <Link
          to={`/deployments/${deployment.id}`}
          className="flex items-center justify-center gap-1 w-full py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
        >
          View Details
          <ChevronRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  )
}

// Kanban Card Component
function KanbanCard({ deployment, onEdit, onDelete, canEdit }) {
  const targetDate = deployment.nextDeliveryDate || deployment.targetDate
  const days = getDaysUntil(targetDate)
  const isOverdue = days !== null && days < 0
  const isUrgent = days !== null && days >= 0 && days <= 7

  const typeColors = {
    ga: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    eap: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    "feature-release": "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    "client-specific": "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  }

  const envColors = {
    production: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    sandbox: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    qa: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  }

  return (
    <Card className={`group hover:shadow-lg transition-all duration-200 border-l-4 ${
      isOverdue ? "border-l-rose-500" : isUrgent ? "border-l-amber-500" : "border-l-transparent"
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <Link to={`/deployments/${deployment.id}`} className="flex-1">
            <div className="font-semibold text-sm hover:text-primary transition-colors line-clamp-1">
              {deployment.productName}
            </div>
          </Link>
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(deployment)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(deployment)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <Users className="h-3 w-3" />
          <span className="truncate">{deployment.clientName || "No client"}</span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${envColors[deployment.environment] || "bg-slate-100 text-slate-700"}`}>
            {formatEnvironment(deployment.environment)}
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${typeColors[deployment.deploymentType] || "bg-slate-100 text-slate-700"}`}>
            {formatDeploymentType(deployment.deploymentType)}
          </span>
        </div>

        <div className="space-y-1.5 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{deployment.checklistProgress || 0}%</span>
          </div>
          <Progress value={deployment.checklistProgress || 0} className="h-1.5" />
        </div>

        {targetDate && (
          <div className={`flex items-center gap-1.5 text-xs ${
            isOverdue ? "text-rose-600 dark:text-rose-400" : isUrgent ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
          }`}>
            <Calendar className="h-3 w-3" />
            <span>
              {isOverdue
                ? `${Math.abs(days)}d overdue`
                : days === 0
                ? "Due today"
                : `${days}d left`}
            </span>
            {isOverdue && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Kanban Column Component
function KanbanColumn({ status, deployments, icon: Icon, color, onEdit, onDelete, canEdit }) {
  const colorClasses = {
    slate: "bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700",
    blue: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
    rose: "bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800",
    emerald: "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800",
  }

  const headerColors = {
    slate: "text-slate-700 dark:text-slate-300",
    blue: "text-blue-700 dark:text-blue-300",
    rose: "text-rose-700 dark:text-rose-300",
    emerald: "text-emerald-700 dark:text-emerald-300",
  }

  const badgeColors = {
    slate: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    blue: "bg-blue-200 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    rose: "bg-rose-200 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
    emerald: "bg-emerald-200 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  }

  return (
    <div className={`rounded-xl border-2 ${colorClasses[color]} min-h-[500px]`}>
      <div className={`p-4 border-b border-inherit`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${headerColors[color]}`} />
            <span className={`font-semibold ${headerColors[color]}`}>{formatStatus(status)}</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badgeColors[color]}`}>
            {deployments.length}
          </span>
        </div>
      </div>
      <div className="p-3 space-y-3">
        {deployments.map((deployment) => (
          <KanbanCard
            key={deployment.id}
            deployment={deployment}
            onEdit={onEdit}
            onDelete={onDelete}
            canEdit={canEdit}
          />
        ))}
        {deployments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Rocket className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No deployments</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DeploymentsPage() {
  const [search, setSearch] = useState("")
  const [view, setView] = useState("cards") // Default to cards
  const [statusFilter, setStatusFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formStep, setFormStep] = useState(1) // Step 1: type, Step 2: details
  const [editingDeployment, setEditingDeployment] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, deployment: null })
  const [formData, setFormData] = useState({
    deploymentType: "",
    productId: "",
    clientId: "",
    clientIds: [],
    environment: "production",
    status: "not_started",
    ownerName: "",
    featureName: "",
    targetDate: "",
    releaseItems: "",
    notes: "",
    notificationEmails: [],
  })
  const [emailInput, setEmailInput] = useState("")
  const queryClient = useQueryClient()
  const { canEdit } = useAuth()

  const { data: deployments, isLoading } = useQuery({
    queryKey: ["deployments", search],
    queryFn: () => deploymentsAPI.list({ search }),
  })

  const { data: products } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => productsAPI.list({ pageSize: 100 }),
  })

  const { data: clients } = useQuery({
    queryKey: ["clients-all"],
    queryFn: () => clientsAPI.list({ pageSize: 100 }),
  })

  // Get selected product for owner suggestions
  const selectedProduct = products?.rows?.find(p => p.id === formData.productId)

  const createMutation = useMutation({
    mutationFn: deploymentsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] })
      closeDialog()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => deploymentsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] })
      closeDialog()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deploymentsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] })
      setDeleteDialog({ open: false, deployment: null })
    },
  })

  const resetForm = () => {
    setFormData({
      deploymentType: "",
      productId: "",
      clientId: "",
      clientIds: [],
      environment: "production",
      status: "not_started",
      ownerName: "",
      featureName: "",
      targetDate: "",
      releaseItems: "",
      notes: "",
      notificationEmails: [],
    })
    setEmailInput("")
    setFormStep(1)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingDeployment(null)
    resetForm()
  }

  const openEditDialog = (deployment) => {
    setEditingDeployment(deployment)
    setFormData({
      deploymentType: deployment.deploymentType || "ga",
      productId: deployment.productId || "",
      clientId: deployment.clientId || "",
      clientIds: deployment.clientIds || [],
      environment: deployment.environment || "production",
      status: deployment.status || "not_started",
      ownerName: deployment.ownerName || "",
      featureName: deployment.featureName || "",
      targetDate: deployment.nextDeliveryDate ? deployment.nextDeliveryDate.split("T")[0] : "",
      releaseItems: deployment.releaseItems || "",
      notes: deployment.notes || "",
      notificationEmails: deployment.notificationEmails || [],
    })
    setEmailInput("")
    setFormStep(2) // Skip to details when editing
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingDeployment(null)
    resetForm()
    setDialogOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...formData }

    // Map targetDate to nextDeliveryDate for backend
    if (payload.targetDate) {
      payload.nextDeliveryDate = payload.targetDate
      delete payload.targetDate
    }

    // For EAP, use clientIds array
    if (formData.deploymentType === "eap") {
      payload.clientIds = formData.clientIds
    }

    if (editingDeployment) {
      updateMutation.mutate({ id: editingDeployment.id, ...payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = () => {
    if (deleteDialog.deployment) {
      deleteMutation.mutate(deleteDialog.deployment.id)
    }
  }

  const handleTypeSelect = (type) => {
    setFormData({ ...formData, deploymentType: type })
    setFormStep(2)
  }

  const handleClientToggle = (clientId) => {
    const current = formData.clientIds || []
    if (current.includes(clientId)) {
      setFormData({ ...formData, clientIds: current.filter(id => id !== clientId) })
    } else {
      setFormData({ ...formData, clientIds: [...current, clientId] })
    }
  }

  const statusColors = {
    not_started: "secondary",
    in_progress: "info",
    blocked: "destructive",
    completed: "success",
  }

  const statusConfig = {
    not_started: { icon: Clock, color: "slate" },
    in_progress: { icon: Activity, color: "blue" },
    blocked: { icon: AlertTriangle, color: "rose" },
    completed: { icon: CheckCircle, color: "emerald" },
  }

  const groupedByStatus = (deployments?.rows || []).reduce((acc, d) => {
    const status = d.status || "not_started"
    if (!acc[status]) acc[status] = []
    acc[status].push(d)
    return acc
  }, {})

  const statusOrder = ["not_started", "in_progress", "blocked", "completed"]

  const filteredDeployments = statusFilter === "all"
    ? deployments?.rows
    : deployments?.rows?.filter(d => d.status === statusFilter)

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  // Gantt view mode state
  const [ganttViewMode, setGanttViewMode] = useState(ViewMode.Week)

  // Convert deployments to Gantt tasks
  const ganttTasks = useMemo(() => {
    if (!deployments?.rows) return []

    const statusColorMap = {
      not_started: "#94a3b8",
      "Not Started": "#94a3b8",
      in_progress: "#3b82f6",
      "In Progress": "#3b82f6",
      blocked: "#ef4444",
      "Blocked": "#ef4444",
      completed: "#22c55e",
      "Released": "#22c55e",
    }

    const progressColorMap = {
      not_started: "#cbd5e1",
      "Not Started": "#cbd5e1",
      in_progress: "#60a5fa",
      "In Progress": "#60a5fa",
      blocked: "#f87171",
      "Blocked": "#f87171",
      completed: "#4ade80",
      "Released": "#4ade80",
    }

    return deployments.rows
      .filter(d => d.nextDeliveryDate || d.targetDate || d.createdAt)
      .map((deployment) => {
        const targetDateStr = deployment.nextDeliveryDate || deployment.targetDate
        const startDate = new Date(deployment.createdAt)
        let endDate = targetDateStr ? new Date(targetDateStr) : new Date(startDate)

        if (endDate <= startDate) {
          endDate = new Date(startDate)
          endDate.setDate(endDate.getDate() + 14)
        }

        const progress = deployment.checklistProgress || 0
        const status = deployment.status || "not_started"

        return {
          id: deployment.id,
          name: `${deployment.productName} - ${deployment.clientName}`,
          start: startDate,
          end: endDate,
          progress: progress,
          type: "task",
          styles: {
            backgroundColor: statusColorMap[status] || "#94a3b8",
            backgroundSelectedColor: statusColorMap[status] || "#94a3b8",
            progressColor: progressColorMap[status] || "#cbd5e1",
            progressSelectedColor: progressColorMap[status] || "#cbd5e1",
          },
          deployment: deployment,
        }
      })
      .sort((a, b) => a.start - b.start)
  }, [deployments?.rows])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 text-white">
              <Rocket className="h-6 w-6" />
            </div>
            Deployments
          </h1>
          <p className="text-muted-foreground mt-1">Track and manage all deployments</p>
        </div>
        {canEdit() && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog() }}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                New Deployment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingDeployment ? "Edit Deployment" : formStep === 1 ? "Select Deployment Type" : "Create Deployment"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingDeployment
                      ? "Update deployment details"
                      : formStep === 1
                      ? "Choose the type of deployment you want to create"
                      : "Configure your deployment details"}
                  </DialogDescription>
                </DialogHeader>

                {/* Step 1: Select Deployment Type */}
                {formStep === 1 && !editingDeployment && (
                  <div className="py-6">
                    <div className="grid grid-cols-2 gap-4">
                      {deploymentTypes.map((type) => {
                        const TypeIcon = type.icon
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => handleTypeSelect(type.value)}
                            className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md hover:border-${type.color}-500 ${
                              formData.deploymentType === type.value
                                ? `border-${type.color}-500 bg-${type.color}-50`
                                : "border-gray-200"
                            }`}
                          >
                            <div className={`p-2 rounded-lg bg-${type.color}-100 w-fit mb-3`}>
                              <TypeIcon className={`h-5 w-5 text-${type.color}-600`} />
                            </div>
                            <h3 className="font-semibold mb-1">{type.label}</h3>
                            <p className="text-sm text-muted-foreground">{type.description}</p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Step 2: Deployment Details */}
                {(formStep === 2 || editingDeployment) && (
                  <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                    {/* Show selected type */}
                    {!editingDeployment && (
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mb-4">
                        {(() => {
                          const type = deploymentTypes.find(t => t.value === formData.deploymentType)
                          const TypeIcon = type?.icon || Rocket
                          return (
                            <>
                              <TypeIcon className="h-5 w-5" />
                              <span className="font-medium">{type?.label}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="ml-auto"
                                onClick={() => setFormStep(1)}
                              >
                                Change
                              </Button>
                            </>
                          )
                        })()}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="productId">Product *</Label>
                        <Select
                          value={formData.productId}
                          onValueChange={(value) => {
                            const product = products?.rows?.find(p => p.id === value)
                            setFormData({
                              ...formData,
                              productId: value,
                              // Auto-set owner from product
                              ownerName: formData.ownerName || product?.deliveryLead || product?.engineeringOwner || ""
                            })
                          }}
                          disabled={!!editingDeployment}
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

                      {/* Client Selection - Single for non-EAP, Multi for EAP */}
                      {formData.deploymentType === "eap" ? (
                        <div className="space-y-2 col-span-2">
                          <Label>Select EAP Clients *</Label>
                          <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                            {clients?.rows?.map((client) => (
                              <label
                                key={client.id}
                                className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                              >
                                <Checkbox
                                  checked={formData.clientIds?.includes(client.id)}
                                  onCheckedChange={() => handleClientToggle(client.id)}
                                />
                                <span className="text-sm">{client.name}</span>
                                {client.tier && (
                                  <Badge variant="outline" className="ml-auto text-xs">
                                    {client.tier}
                                  </Badge>
                                )}
                              </label>
                            ))}
                          </div>
                          {formData.clientIds?.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {formData.clientIds.length} client(s) selected
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="clientId">Client *</Label>
                          <Select
                            value={formData.clientId}
                            onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                            disabled={!!editingDeployment}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select client" />
                            </SelectTrigger>
                            <SelectContent>
                              {clients?.rows?.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                  {client.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="environment">Environment</Label>
                        <Select
                          value={formData.environment}
                          onValueChange={(value) => setFormData({ ...formData, environment: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {environments.map((env) => (
                              <SelectItem key={env} value={env}>
                                {formatEnvironment(env)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => setFormData({ ...formData, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                {formatStatus(status)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ownerName" className="flex items-center gap-2">
                          <User className="h-3 w-3 text-cyan-500" />
                          Owner
                        </Label>
                        <Input
                          id="ownerName"
                          value={formData.ownerName}
                          onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                          placeholder={selectedProduct?.deliveryLead || selectedProduct?.engineeringOwner || "Enter owner name"}
                        />
                        {selectedProduct && (selectedProduct.deliveryLead || selectedProduct.engineeringOwner) && (
                          <p className="text-xs text-muted-foreground">
                            Suggested: {selectedProduct.deliveryLead || selectedProduct.engineeringOwner}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="targetDate">Target Date</Label>
                        <Input
                          id="targetDate"
                          type="date"
                          value={formData.targetDate}
                          onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="featureName">Feature Name</Label>
                      <Input
                        id="featureName"
                        value={formData.featureName}
                        onChange={(e) => setFormData({ ...formData, featureName: e.target.value })}
                        placeholder="e.g., New Login Flow"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="releaseItems">Release Items</Label>
                      <Textarea
                        id="releaseItems"
                        value={formData.releaseItems}
                        onChange={(e) => setFormData({ ...formData, releaseItems: e.target.value })}
                        placeholder="List of items to be released..."
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Additional notes..."
                        rows={2}
                      />
                    </div>

                    {/* Notification Emails */}
                    <div className="space-y-2 border-t pt-4 mt-4">
                      <Label className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-amber-500" />
                        Notification Emails
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        These emails will receive alerts at 7 days, 3 days, on deployment date, and daily if overdue.
                        PO, EO, Delivery Lead, and Owner are automatically included.
                      </p>
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="Add email address"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              if (emailInput && emailInput.includes("@")) {
                                if (!formData.notificationEmails.includes(emailInput)) {
                                  setFormData({
                                    ...formData,
                                    notificationEmails: [...formData.notificationEmails, emailInput]
                                  })
                                }
                                setEmailInput("")
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (emailInput && emailInput.includes("@")) {
                              if (!formData.notificationEmails.includes(emailInput)) {
                                setFormData({
                                  ...formData,
                                  notificationEmails: [...formData.notificationEmails, emailInput]
                                })
                              }
                              setEmailInput("")
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {formData.notificationEmails.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.notificationEmails.map((email, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1 py-1">
                              <Mail className="h-3 w-3" />
                              {email}
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    notificationEmails: formData.notificationEmails.filter((_, i) => i !== index)
                                  })
                                }}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Cancel
                  </Button>
                  {(formStep === 2 || editingDeployment) && (
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingDeployment ? "Save Changes" : "Create Deployment"}
                    </Button>
                  )}
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search deployments..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {(view === "list" || view === "cards") && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {formatStatus(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={view === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("cards")}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              Cards
            </Button>
            <Button
              variant={view === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              List
            </Button>
            <Button
              variant={view === "kanban" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("kanban")}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </Button>
            <Button
              variant={view === "gantt" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("gantt")}
              className="gap-2"
            >
              <GanttChartSquare className="h-4 w-4" />
              Gantt
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : view === "cards" ? (
        /* Card View */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredDeployments?.map((deployment) => (
            <DeploymentCard
              key={deployment.id}
              deployment={deployment}
              onEdit={openEditDialog}
              onDelete={(d) => setDeleteDialog({ open: true, deployment: d })}
              canEdit={canEdit()}
            />
          ))}
          {(!filteredDeployments || filteredDeployments.length === 0) && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Rocket className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No deployments found</p>
            </div>
          )}
        </div>
      ) : view === "list" ? (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Target Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeployments?.map((deployment) => {
                  const targetDate = deployment.nextDeliveryDate || deployment.targetDate
                  const days = getDaysUntil(targetDate)
                  const isOverdue = days !== null && days < 0
                  return (
                    <TableRow key={deployment.id} className={isOverdue ? "bg-rose-50/50 dark:bg-rose-950/20" : ""}>
                      <TableCell className="font-medium">
                        <Link
                          to={`/deployments/${deployment.id}`}
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="hover:underline">{deployment.productName}</span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          to={`/deployments/${deployment.id}`}
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="hover:underline">{deployment.clientName}</span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        {deployment.ownerName ? (
                          <div className="flex items-center gap-1.5">
                            <User className="h-3 w-3 text-cyan-500" />
                            {deployment.ownerName}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[deployment.status]}>
                          {formatStatus(deployment.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 w-32">
                          <Progress value={deployment.checklistProgress || 0} className="h-2" />
                          <span className="text-xs text-muted-foreground w-8">
                            {deployment.checklistProgress || 0}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{formatDeploymentType(deployment.deploymentType)}</Badge>
                      </TableCell>
                      <TableCell>
                        {targetDate ? (
                          <div className={`flex items-center gap-1.5 text-sm ${isOverdue ? "text-rose-600" : ""}`}>
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(targetDate).toLocaleDateString()}
                            {isOverdue && <Badge variant="destructive" className="ml-1 text-[10px] px-1">Overdue</Badge>}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/deployments/${deployment.id}`}>
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
                                <DropdownMenuItem onClick={() => openEditDialog(deployment)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeleteDialog({ open: true, deployment })}
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
                  )
                })}
                {(!filteredDeployments || filteredDeployments.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      <Rocket className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      No deployments found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : view === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {statusOrder.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              deployments={groupedByStatus[status] || []}
              icon={statusConfig[status].icon}
              color={statusConfig[status].color}
              onEdit={openEditDialog}
              onDelete={(d) => setDeleteDialog({ open: true, deployment: d })}
              canEdit={canEdit()}
            />
          ))}
        </div>
      ) : (
        /* Gantt View */
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GanttChartSquare className="h-5 w-5 text-indigo-500" />
                <span className="font-semibold">Deployment Timeline</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">View:</span>
                <Select value={ganttViewMode} onValueChange={(v) => setGanttViewMode(v)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ViewMode.Day}>Day</SelectItem>
                    <SelectItem value={ViewMode.Week}>Week</SelectItem>
                    <SelectItem value={ViewMode.Month}>Month</SelectItem>
                    <SelectItem value={ViewMode.Year}>Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-slate-400" />
                <span className="text-muted-foreground">Not Started</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-muted-foreground">In Progress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span className="text-muted-foreground">Blocked</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span className="text-muted-foreground">Completed</span>
              </div>
            </div>

            {ganttTasks.length > 0 ? (
              <div className="gantt-container overflow-x-auto">
                <Gantt
                  tasks={ganttTasks}
                  viewMode={ganttViewMode}
                  onDoubleClick={(task) => {
                    window.location.href = `/deployments/${task.id}`
                  }}
                  listCellWidth=""
                  columnWidth={
                    ganttViewMode === ViewMode.Day ? 65 :
                    ganttViewMode === ViewMode.Week ? 250 :
                    ganttViewMode === ViewMode.Month ? 300 :
                    500
                  }
                  barCornerRadius={4}
                  barFill={75}
                  handleWidth={8}
                  todayColor="rgba(99, 102, 241, 0.1)"
                  TooltipContent={({ task }) => {
                    const deployment = task.deployment
                    if (!deployment) return null
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl max-w-xs">
                        <div className="font-semibold mb-1">{deployment.productName}</div>
                        <div className="text-sm text-slate-300 mb-2">{deployment.clientName}</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400">Status:</span>
                            <span className="ml-1">{formatStatus(deployment.status)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Progress:</span>
                            <span className="ml-1">{deployment.checklistProgress || 0}%</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Type:</span>
                            <span className="ml-1">{formatDeploymentType(deployment.deploymentType)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Env:</span>
                            <span className="ml-1">{formatEnvironment(deployment.environment)}</span>
                          </div>
                        </div>
                        {(deployment.nextDeliveryDate || deployment.targetDate) && (
                          <div className="mt-2 pt-2 border-t border-slate-700 text-xs">
                            <span className="text-slate-400">Target:</span>
                            <span className="ml-1">
                              {new Date(deployment.nextDeliveryDate || deployment.targetDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        <div className="mt-2 text-xs text-slate-400">
                          Double-click to view details
                        </div>
                      </div>
                    )
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <GanttChartSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No deployments with dates to display</p>
                <p className="text-sm mt-1">Add target dates to deployments to see them in the timeline</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deployment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the deployment for "{deleteDialog.deployment?.productName}" - "{deleteDialog.deployment?.clientName}"? This action cannot be undone.
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
