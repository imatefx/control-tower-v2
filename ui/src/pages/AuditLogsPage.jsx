import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { auditAPI } from "@/services/api"
import { formatDateTime } from "@/utils/dateFormat"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ScrollText,
  Loader2,
  Search,
  Eye,
  Calendar,
  User,
  Activity,
  Plus,
  Edit,
  Trash2,
  LogIn,
  LogOut,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

const actionTypes = [
  "create",
  "update",
  "delete",
  "login",
  "logout",
  "approve",
  "reject",
  "status_change",
]

const resourceTypes = [
  "user",
  "product",
  "client",
  "deployment",
  "releaseNote",
  "approval",
]

const actionIcons = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  login: LogIn,
  logout: LogOut,
  approve: CheckCircle,
  reject: XCircle,
  status_change: RefreshCw,
}

export default function AuditLogsPage() {
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [entityFilter, setEntityFilter] = useState("all")
  const [selectedLog, setSelectedLog] = useState(null)
  const [page, setPage] = useState(1)

  const { data: logsResponse, isLoading } = useQuery({
    queryKey: ["audit-logs", search, actionFilter, entityFilter, page],
    queryFn: () =>
      auditAPI.list({
        search,
        action: actionFilter === "all" ? undefined : actionFilter,
        resourceType: entityFilter === "all" ? undefined : entityFilter,
        page,
        limit: 20,
      }),
  })

  const actionColors = {
    create: "success",
    update: "info",
    delete: "destructive",
    login: "default",
    logout: "secondary",
    approve: "success",
    reject: "destructive",
    status_change: "warning",
  }

  const logs = logsResponse?.data || []
  const totalLogs = logsResponse?.pagination?.total || 0
  const totalPages = logsResponse?.pagination?.totalPages || 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-white">
              <ScrollText className="h-6 w-6" />
            </div>
            Audit Logs
          </h1>
          <p className="text-muted-foreground mt-1">Track all system activities and changes</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Total Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLogs}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-500" />
              Creates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {logs.filter(l => l.action === "create").length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This page</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Edit className="h-4 w-4 text-amber-500" />
              Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {logs.filter(l => l.action === "update" || l.action === "status_change").length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This page</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-500" />
              Deletes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {logs.filter(l => l.action === "delete").length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This page</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {actionTypes.map((action) => (
              <SelectItem key={action} value={action}>
                <span className="capitalize">{action.replace("_", " ")}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="All Resources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Resources</SelectItem>
            {resourceTypes.map((type) => (
              <SelectItem key={type} value={type}>
                <span className="capitalize">{type.replace(/([A-Z])/g, " $1").trim()}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-slate-500" />
            Activity Log
          </CardTitle>
          <CardDescription>Complete audit trail of system activities</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const ActionIcon = actionIcons[log.action] || Activity
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDateTime(log.timestamp)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                              <User className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                            </div>
                            {log.userName || "System"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={actionColors[log.action] || "default"} className="gap-1">
                            <ActionIcon className="h-3 w-3" />
                            {log.action?.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {log.resourceType?.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.resourceName || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                        <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No audit logs found</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, totalLogs)} of{" "}
                    {totalLogs} entries
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (page <= 3) {
                          pageNum = i + 1
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = page - 2 + i
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-slate-500" />
              Audit Log Details
            </DialogTitle>
            <DialogDescription>
              Full details of the audit log entry
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <label className="text-xs font-medium text-muted-foreground">
                    Timestamp
                  </label>
                  <p className="font-medium mt-1">
                    {formatDateTime(selectedLog.timestamp)}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <label className="text-xs font-medium text-muted-foreground">
                    User
                  </label>
                  <p className="font-medium mt-1">
                    {selectedLog.userName || "System"}
                  </p>
                  {selectedLog.userEmail && (
                    <p className="text-xs text-muted-foreground">{selectedLog.userEmail}</p>
                  )}
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <label className="text-xs font-medium text-muted-foreground">
                    Action
                  </label>
                  <p className="mt-1">
                    <Badge variant={actionColors[selectedLog.action] || "default"}>
                      {selectedLog.action?.replace("_", " ")}
                    </Badge>
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <label className="text-xs font-medium text-muted-foreground">
                    Resource Type
                  </label>
                  <p className="mt-1">
                    <Badge variant="outline" className="capitalize">
                      {selectedLog.resourceType?.replace("_", " ")}
                    </Badge>
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <label className="text-xs font-medium text-muted-foreground">
                    Resource ID
                  </label>
                  <p className="font-mono text-sm mt-1">{selectedLog.resourceId || "-"}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <label className="text-xs font-medium text-muted-foreground">
                    Resource Name
                  </label>
                  <p className="font-medium mt-1">{selectedLog.resourceName || "-"}</p>
                </div>
              </div>

              {selectedLog.changes && selectedLog.changes.length > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <label className="text-xs font-medium text-muted-foreground">
                    Changes
                  </label>
                  <div className="mt-2 space-y-2">
                    {selectedLog.changes.map((change, idx) => (
                      <div key={idx} className="p-2 bg-background rounded border text-sm">
                        <span className="font-medium capitalize">{change.field}:</span>
                        <span className="text-red-500 ml-2 line-through">{String(change.oldValue || "")}</span>
                        <span className="mx-2">→</span>
                        <span className="text-green-500">{String(change.newValue || "")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <label className="text-xs font-medium text-muted-foreground">
                    Metadata
                  </label>
                  <pre className="mt-2 p-3 bg-slate-900 text-slate-100 rounded-lg text-sm overflow-auto max-h-64">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
