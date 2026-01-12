import { useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { clientsAPI, deploymentsAPI } from "@/services/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { ArrowLeft, Users, Rocket, Package, ExternalLink, Loader2, Mail, MapPin, Pencil, Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { canEdit } = useAuth()
  const [deleteDialog, setDeleteDialog] = useState(false)

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", id],
    queryFn: () => clientsAPI.get(id),
  })

  const { data: deployments } = useQuery({
    queryKey: ["deployments", "client", id],
    queryFn: () => deploymentsAPI.list({ clientId: id }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => clientsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      navigate("/clients")
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
    in_progress: "info",
    blocked: "destructive",
    completed: "success",
  }

  const tierColors = {
    enterprise: "default",
    business: "secondary",
    starter: "outline",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/clients">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8" />
            {client.name}
          </h1>
          <p className="text-muted-foreground">
            <code className="bg-muted px-1 py-0.5 rounded text-sm">{client.code}</code>
          </p>
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

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={tierColors[client.tier]}>
              {client.tier?.charAt(0).toUpperCase() + client.tier?.slice(1)}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Region
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{client.region || "N/A"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Deployments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deployments?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" /> Contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            {client.contactName ? (
              <div className="text-sm">
                <div className="font-medium">{client.contactName}</div>
                <div className="text-muted-foreground">{client.contactEmail}</div>
              </div>
            ) : (
              <span className="text-muted-foreground">No contact set</span>
            )}
          </CardContent>
        </Card>
      </div>

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
    </div>
  )
}
