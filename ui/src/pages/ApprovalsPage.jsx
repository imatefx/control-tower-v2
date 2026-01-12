import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { approvalsAPI } from "@/services/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CheckSquare,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Package,
  Users,
  Search,
  LayoutGrid,
  List,
  MoreHorizontal,
  ChevronRight,
  Calendar,
  User,
  FileText,
  AlertCircle,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

// Approval Card Component
function ApprovalCard({ approval, onApprove, onReject, isPending }) {
  const statusConfig = {
    pending: { bg: "bg-amber-50", text: "text-amber-700", icon: Clock },
    approved: { bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle },
    rejected: { bg: "bg-red-50", text: "text-red-700", icon: XCircle },
  }

  const config = statusConfig[approval.status] || statusConfig.pending
  const StatusIcon = config.icon

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
      <div className={`h-1.5 ${approval.status === "pending" ? "bg-gradient-to-r from-amber-500 to-orange-500" : approval.status === "approved" ? "bg-gradient-to-r from-emerald-500 to-green-500" : "bg-gradient-to-r from-red-500 to-rose-500"}`} />
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${config.bg}`}>
              <FileText className={`h-4 w-4 ${config.text}`} />
            </div>
            <h3 className="font-semibold text-lg">
              {approval.type === "release" ? "Release Approval" : "Deployment Approval"}
            </h3>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
            <StatusIcon className="h-3 w-3" />
            {approval.status}
          </div>
        </div>

        {approval.deployment && (
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span>{approval.deployment.productName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{approval.deployment.clientName}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <User className="h-3 w-3" />
          <span>Requested by {approval.requestedBy?.name || "Unknown"}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Calendar className="h-3 w-3" />
          <span>{new Date(approval.createdAt).toLocaleDateString()}</span>
        </div>

        {approval.notes && (
          <div className="p-2 bg-muted rounded-lg text-xs mb-3">
            {approval.notes}
          </div>
        )}

        {approval.status === "pending" && (
          <div className="flex items-center gap-2 pt-3 border-t">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onApprove(approval)}
              disabled={isPending}
            >
              {isPending ? (
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
              className="flex-1"
              onClick={() => onReject(approval)}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        )}

        {approval.deployment && (
          <Link
            to={`/deployments/${approval.deployment.id}`}
            className="mt-3 flex items-center justify-center gap-1 w-full py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
          >
            View Deployment
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </CardContent>
    </Card>
  )
}

export default function ApprovalsPage() {
  const [search, setSearch] = useState("")
  const [view, setView] = useState("cards")
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

  const pendingCount = pendingApprovals?.rows?.length || 0
  const approvedCount = allApprovals?.rows?.filter((a) => a.status === "approved").length || 0
  const rejectedCount = allApprovals?.rows?.filter((a) => a.status === "rejected").length || 0

  const filteredPending = pendingApprovals?.rows?.filter(a =>
    !search ||
    a.deployment?.productName?.toLowerCase().includes(search.toLowerCase()) ||
    a.deployment?.clientName?.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
              <CheckSquare className="h-6 w-6" />
            </div>
            Approvals
          </h1>
          <p className="text-muted-foreground mt-1">Manage deployment and release approvals</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{approvedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and View Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search approvals..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-1">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All Approvals</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : view === "cards" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredPending.map((approval) => (
                <ApprovalCard
                  key={approval.id}
                  approval={approval}
                  onApprove={handleApprove}
                  onReject={(a) => setRejectDialog(a)}
                  isPending={approveMutation.isPending}
                />
              ))}
              {filteredPending.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No pending approvals</p>
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>Approvals awaiting your review</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPending.map((approval) => (
                      <TableRow key={approval.id}>
                        <TableCell className="capitalize">{approval.type}</TableCell>
                        <TableCell>{approval.deployment?.productName || "-"}</TableCell>
                        <TableCell>{approval.deployment?.clientName || "-"}</TableCell>
                        <TableCell>{approval.requestedBy?.name || "Unknown"}</TableCell>
                        <TableCell>{new Date(approval.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(approval)}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setRejectDialog(approval)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredPending.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No pending approvals
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
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
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Reject Approval
            </DialogTitle>
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
