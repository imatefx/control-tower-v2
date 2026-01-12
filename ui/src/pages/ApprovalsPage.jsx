import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { approvalsAPI } from "@/services/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckSquare,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Package,
  Users,
} from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"

export default function ApprovalsPage() {
  const [rejectDialog, setRejectDialog] = useState(null)
  const [rejectComment, setRejectComment] = useState("")
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { data: pendingApprovals, isLoading: pendingLoading } = useQuery({
    queryKey: ["approvals", "pending"],
    queryFn: () => approvalsAPI.list({ status: "pending" }),
  })

  const { data: allApprovals, isLoading: allLoading } = useQuery({
    queryKey: ["approvals", "all"],
    queryFn: () => approvalsAPI.list(),
  })

  const approveMutation = useMutation({
    mutationFn: (id) => approvalsAPI.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, comment }) => approvalsAPI.reject(id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] })
      setRejectDialog(null)
      setRejectComment("")
    },
  })

  const handleApprove = (approval) => {
    approveMutation.mutate(approval.id)
  }

  const handleReject = () => {
    if (rejectDialog) {
      rejectMutation.mutate({ id: rejectDialog.id, comment: rejectComment })
    }
  }

  const statusColors = {
    pending: "warning",
    approved: "success",
    rejected: "destructive",
  }

  const statusIcons = {
    pending: Clock,
    approved: CheckCircle,
    rejected: XCircle,
  }

  const isLoading = pendingLoading || allLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <CheckSquare className="h-8 w-8" />
          Approvals
        </h1>
        <p className="text-muted-foreground">
          Manage deployment and release approvals
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {pendingApprovals?.rows?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {allApprovals?.rows?.filter((a) => a.status === "approved").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {allApprovals?.rows?.filter((a) => a.status === "rejected").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingApprovals?.rows?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="all">All Approvals</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Approvals awaiting your review</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingApprovals?.rows?.length > 0 ? (
                <div className="space-y-4">
                  {pendingApprovals.rows.map((approval) => (
                    <div
                      key={approval.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">
                            {approval.type === "release"
                              ? "Release Approval"
                              : "Deployment Approval"}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Requested by {approval.requestedBy?.name || "Unknown"}
                          </p>
                        </div>
                        <Badge variant={statusColors[approval.status]}>
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      </div>

                      {approval.deployment && (
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            {approval.deployment.productName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {approval.deployment.clientName}
                          </span>
                        </div>
                      )}

                      {approval.notes && (
                        <p className="text-sm bg-muted p-2 rounded">{approval.notes}</p>
                      )}

                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(approval)}
                          disabled={approveMutation.isPending}
                        >
                          {approveMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setRejectDialog(approval)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        {approval.deployment && (
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/deployments/${approval.deployment.id}`}>
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No pending approvals
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Approvals</CardTitle>
              <CardDescription>Complete approval history</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allApprovals?.rows?.map((approval) => {
                    const StatusIcon = statusIcons[approval.status]
                    return (
                      <TableRow key={approval.id}>
                        <TableCell className="capitalize">{approval.type}</TableCell>
                        <TableCell>{approval.deployment?.product?.name || "-"}</TableCell>
                        <TableCell>{approval.deployment?.client?.name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={statusColors[approval.status]} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {approval.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{approval.requestedBy?.name || "Unknown"}</TableCell>
                        <TableCell>
                          {new Date(approval.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {(!allApprovals?.rows || allApprovals.rows.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No approvals found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Approval</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectComment.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
