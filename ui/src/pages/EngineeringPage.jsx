import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { engineeringAPI, deploymentsAPI } from "@/services/api"
import { formatDate } from "@/utils/dateFormat"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Wrench,
  Users,
  Loader2,
  Plus,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Search,
  LayoutGrid,
  List,
  Gauge,
  Clock,
  Target,
  Zap,
  BarChart3,
  ChevronRight,
  Activity,
} from "lucide-react"

// Team Capacity Card Component
function TeamCapacityCard({ team }) {
  const util = team.totalCapacity > 0
    ? Math.round((team.allocatedCapacity / team.totalCapacity) * 100)
    : 0

  const getUtilColor = () => {
    if (util >= 90) return { bg: "bg-red-50", text: "text-red-700", progress: "bg-red-500" }
    if (util >= 70) return { bg: "bg-amber-50", text: "text-amber-700", progress: "bg-amber-500" }
    return { bg: "bg-emerald-50", text: "text-emerald-700", progress: "bg-emerald-500" }
  }

  const colors = getUtilColor()

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50">
              <Users className="h-4 w-4 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-lg">{team.teamName}</h3>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
            {util}%
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
            <div className="text-xs text-muted-foreground">Total</div>
            <p className="font-semibold text-lg">{team.totalCapacity}h</p>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
            <div className="text-xs text-muted-foreground">Allocated</div>
            <p className="font-semibold text-lg">{team.allocatedCapacity}h</p>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
            <div className="text-xs text-muted-foreground">Available</div>
            <p className="font-semibold text-lg text-emerald-600">{team.availableCapacity}h</p>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Utilization</span>
            <span className={`font-medium ${colors.text}`}>{util}%</span>
          </div>
          <Progress value={util} className={`h-2 ${colors.progress}`} />
        </div>

        {util >= 90 && (
          <div className="p-2 bg-red-50 rounded-lg text-xs text-red-700 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            High utilization - consider expanding capacity
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function EngineeringPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [view, setView] = useState("cards")
  const [formData, setFormData] = useState({
    teamName: "",
    totalCapacity: 0,
    allocatedCapacity: 0,
    availableCapacity: 0,
    weekStart: new Date().toISOString().split("T")[0],
  })
  const queryClient = useQueryClient()

  const { data: capacityData, isLoading: capacityLoading } = useQuery({
    queryKey: ["team-capacity"],
    queryFn: () => engineeringAPI.getTeamCapacity(),
  })

  const { data: resourceAllocation, isLoading: allocationLoading } = useQuery({
    queryKey: ["resource-allocation"],
    queryFn: () => engineeringAPI.getResourceAllocation(),
  })

  const { data: deployments, isLoading: deploymentsLoading } = useQuery({
    queryKey: ["deployments", "in-progress"],
    queryFn: () => deploymentsAPI.list({ status: "In Progress" }),
  })

  const createCapacityMutation = useMutation({
    mutationFn: engineeringAPI.createTeamCapacity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-capacity"] })
      setDialogOpen(false)
      setFormData({
        teamName: "",
        totalCapacity: 0,
        allocatedCapacity: 0,
        availableCapacity: 0,
        weekStart: new Date().toISOString().split("T")[0],
      })
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    createCapacityMutation.mutate(formData)
  }

  const isLoading = capacityLoading || allocationLoading || deploymentsLoading

  const teams = capacityData?.rows || []
  const totalCapacity = teams.reduce((sum, t) => sum + t.totalCapacity, 0) || 0
  const allocatedCapacity = teams.reduce((sum, t) => sum + t.allocatedCapacity, 0) || 0
  const availableCapacity = teams.reduce((sum, t) => sum + t.availableCapacity, 0) || 0
  const utilizationPercent = totalCapacity > 0 ? Math.round((allocatedCapacity / totalCapacity) * 100) : 0

  const activeDeployments = deployments?.rows?.length || 0
  const blockedDeployments = deployments?.rows?.filter((d) => d.status === "Blocked").length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <Wrench className="h-6 w-6" />
            </div>
            Engineering Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Resource management and team capacity tracking</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Capacity
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Add Team Capacity</DialogTitle>
                <DialogDescription>
                  Record team capacity for a given week
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="teamName">Team Name</Label>
                  <Input
                    id="teamName"
                    value={formData.teamName}
                    onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weekStart">Week Start</Label>
                  <Input
                    id="weekStart"
                    type="date"
                    value={formData.weekStart}
                    onChange={(e) => setFormData({ ...formData, weekStart: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalCapacity">Total Capacity (hrs)</Label>
                    <Input
                      id="totalCapacity"
                      type="number"
                      min="0"
                      value={formData.totalCapacity}
                      onChange={(e) =>
                        setFormData({ ...formData, totalCapacity: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allocatedCapacity">Allocated (hrs)</Label>
                    <Input
                      id="allocatedCapacity"
                      type="number"
                      min="0"
                      value={formData.allocatedCapacity}
                      onChange={(e) =>
                        setFormData({ ...formData, allocatedCapacity: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="availableCapacity">Available (hrs)</Label>
                    <Input
                      id="availableCapacity"
                      type="number"
                      min="0"
                      value={formData.availableCapacity}
                      onChange={(e) =>
                        setFormData({ ...formData, availableCapacity: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCapacityMutation.isPending}>
                  {createCapacityMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-500" />
              Total Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCapacity} hrs</div>
            <p className="text-xs text-muted-foreground mt-1">{teams.length} team(s)</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Gauge className="h-4 w-4 text-amber-500" />
              Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{utilizationPercent}%</div>
              {utilizationPercent > 90 && (
                <Badge variant="warning" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  High
                </Badge>
              )}
            </div>
            <Progress value={utilizationPercent} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-500" />
              Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{availableCapacity} hrs</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to allocate</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Active Deployments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeDeployments}</div>
            <p className="text-xs text-muted-foreground mt-1">In progress</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Blocked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{blockedDeployments}</div>
            <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-end">
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

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : view === "cards" ? (
        <>
          {/* Team Capacity Cards */}
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-indigo-500" />
              Team Capacity
            </h2>
            {teams.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {teams.map((team) => (
                  <TeamCapacityCard key={team.id} team={team} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground">No team capacity data available</p>
                  <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Team Capacity
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Engineering Insights
              </CardTitle>
              <CardDescription>Key metrics and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-emerald-500" />
                    <h4 className="font-medium">Velocity Trend</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Track deployment completion rate over time
                  </p>
                  <div className="mt-2 text-2xl font-bold text-emerald-500">+15%</div>
                </div>
                <div className="p-4 border rounded-lg bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <h4 className="font-medium">Bottlenecks</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {blockedDeployments > 0
                      ? `${blockedDeployments} deployment(s) currently blocked`
                      : "No blocked deployments"}
                  </p>
                </div>
                <div className="p-4 border rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-indigo-500" />
                    <h4 className="font-medium">Capacity Forecast</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {utilizationPercent > 80
                      ? "Consider increasing capacity for upcoming sprints"
                      : "Capacity levels are healthy"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                Team Capacity
              </CardTitle>
              <CardDescription>Current week capacity by team</CardDescription>
            </CardHeader>
            <CardContent>
              {teams.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Allocated</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Utilization</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.map((team) => {
                      const util = team.totalCapacity > 0
                        ? Math.round((team.allocatedCapacity / team.totalCapacity) * 100)
                        : 0
                      return (
                        <TableRow key={team.id}>
                          <TableCell className="font-medium">{team.teamName}</TableCell>
                          <TableCell>{team.totalCapacity}h</TableCell>
                          <TableCell>{team.allocatedCapacity}h</TableCell>
                          <TableCell className="text-emerald-600">{team.availableCapacity}h</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={util} className="w-16 h-2" />
                              <span className="text-xs">{util}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No capacity data available
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                Resource Allocation
              </CardTitle>
              <CardDescription>Current resource assignments</CardDescription>
            </CardHeader>
            <CardContent>
              {resourceAllocation && resourceAllocation.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resource</TableHead>
                      <TableHead>Deployment</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Period</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resourceAllocation.map((allocation) => (
                      <TableRow key={allocation.id}>
                        <TableCell className="font-medium">{allocation.resourceName}</TableCell>
                        <TableCell>{allocation.deployment?.product?.name}</TableCell>
                        <TableCell>{allocation.allocatedHours}h</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(allocation.startDate)} -
                          {formatDate(allocation.endDate)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No resource allocations
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
