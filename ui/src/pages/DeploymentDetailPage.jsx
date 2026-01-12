import { useParams, Link, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { deploymentsAPI, checklistsAPI, checklistTemplatesAPI } from "@/services/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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

  // Use dynamic checklist items from templates
  const checklistItems = checklistTemplates || []

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
    in_progress: "info",
    blocked: "destructive",
    completed: "success",
  }

  const statusIcons = {
    not_started: Clock,
    in_progress: Rocket,
    blocked: AlertTriangle,
    completed: CheckCircle,
  }

  const StatusIcon = statusIcons[deployment.status] || Clock

  const completedItems = checklist
    ? checklistItems.filter((item) => checklist[item.key]).length
    : 0
  const progressPercent = Math.round((completedItems / checklistItems.length) * 100)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/deployments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Rocket className="h-8 w-8" />
            Deployment Details
          </h1>
          <p className="text-muted-foreground">
            {deployment.productName} for {deployment.clientName}
          </p>
        </div>
        {canEdit() && (
          <div className="flex items-center gap-2">
            <Select value={deployment.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
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

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Product
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              to={`/products/${deployment.productId}`}
              className="text-lg font-semibold hover:underline"
            >
              {deployment.productName}
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              to={`/clients/${deployment.clientId}`}
              className="text-lg font-semibold hover:underline"
            >
              {deployment.clientName}
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={statusColors[deployment.status]} className="gap-1">
              <StatusIcon className="h-3 w-3" />
              {deployment.status?.replace("_", " ")}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Environment</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-lg">
              {deployment.environment?.toLowerCase() === "qa"
                ? "QA"
                : deployment.environment
                  ? deployment.environment.charAt(0).toUpperCase() + deployment.environment.slice(1)
                  : "-"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {deployment.status === "blocked" && deployment.blockedComment && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Blocked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{deployment.blockedComment}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Deployment Checklist</CardTitle>
            <CardDescription>
              Track progress through the deployment checklist
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Progress value={progressPercent} className="flex-1" />
              <span className="text-sm font-medium">
                {completedItems}/{checklistItems.length} ({progressPercent}%)
              </span>
            </div>

            <div className="space-y-3">
              {checklistItems.map((item, index) => (
                <div
                  key={item.key}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={item.key}
                    checked={checklist?.[item.key] || false}
                    onCheckedChange={() =>
                      canEdit() && handleChecklistToggle(item.key, checklist?.[item.key])
                    }
                    disabled={!canEdit() || updateChecklistMutation.isPending}
                  />
                  <Label
                    htmlFor={item.key}
                    className="flex-1 cursor-pointer font-normal"
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
            <CardTitle>Deployment Information</CardTitle>
            <CardDescription>Additional details about this deployment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Version</Label>
                <p className="font-medium">{deployment.version || "Not specified"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Created</Label>
                <p className="font-medium">
                  {new Date(deployment.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Last Updated</Label>
                <p className="font-medium">
                  {new Date(deployment.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Deployment Type</Label>
                <p className="font-medium">
                  {deployment.deploymentType?.toLowerCase() === "ga" ? "GA" :
                   deployment.deploymentType?.toLowerCase() === "eap" ? "EAP" :
                   deployment.deploymentType?.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "-"}
                </p>
              </div>
            </div>

            {deployment.notes && (
              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Notes
                </Label>
                <div className="mt-1 space-y-2">
                  {(() => {
                    let notesArray = deployment.notes
                    // Parse JSON string if needed
                    if (typeof notesArray === "string") {
                      try {
                        notesArray = JSON.parse(notesArray)
                      } catch {
                        return <p className="text-sm bg-muted p-3 rounded-lg">{deployment.notes}</p>
                      }
                    }
                    if (Array.isArray(notesArray)) {
                      return notesArray.map((note, idx) => (
                        <div key={note.id || idx} className="text-sm bg-muted p-3 rounded-lg">
                          <p>{note.text}</p>
                          <div className="text-xs text-muted-foreground mt-1">
                            {note.author} • {new Date(note.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      ))
                    }
                    return <p className="text-sm bg-muted p-3 rounded-lg">{String(deployment.notes)}</p>
                  })()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
