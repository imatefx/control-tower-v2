import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { engineeringAPI, deploymentsAPI } from "@/services/api"
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
} from "lucide-react"

export default function EngineeringPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
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
    queryFn: () => deploymentsAPI.list({ status: "in_progress" }),
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const totalCapacity = capacityData?.reduce((sum, t) => sum + t.totalCapacity, 0) || 0
  const allocatedCapacity = capacityData?.reduce((sum, t) => sum + t.allocatedCapacity, 0) || 0
  const utilizationPercent = totalCapacity > 0 ? Math.round((allocatedCapacity / totalCapacity) * 100) : 0

  const activeDeployments = deployments?.rows?.length || 0
  const blockedDeployments = deployments?.rows?.filter((d) => d.status === "blocked").length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Wrench className="h-8 w-8" />
            Engineering Dashboard
          </h1>
          <p className="text-muted-foreground">
            Resource management and team capacity tracking
          </p>
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
                    <Label htmlFor="totalCapacity">Total Capacity</Label>
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
                    <Label htmlFor="allocatedCapacity">Allocated</Label>
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
                    <Label htmlFor="availableCapacity">Available</Label>
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

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCapacity} hrs</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{utilizationPercent}%</div>
              {utilizationPercent > 90 && (
                <Badge variant="warning">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  High
                </Badge>
              )}
            </div>
            <Progress value={utilizationPercent} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Deployments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDeployments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Blocked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{blockedDeployments}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Capacity
            </CardTitle>
            <CardDescription>Current week capacity by team</CardDescription>
          </CardHeader>
          <CardContent>
            {capacityData && capacityData.length > 0 ? (
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
                  {capacityData.map((team) => {
                    const util = team.totalCapacity > 0
                      ? Math.round((team.allocatedCapacity / team.totalCapacity) * 100)
                      : 0
                    return (
                      <TableRow key={team.id}>
                        <TableCell className="font-medium">{team.teamName}</TableCell>
                        <TableCell>{team.totalCapacity}h</TableCell>
                        <TableCell>{team.allocatedCapacity}h</TableCell>
                        <TableCell>{team.availableCapacity}h</TableCell>
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
              <Calendar className="h-5 w-5" />
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
                        {new Date(allocation.startDate).toLocaleDateString()} -
                        {new Date(allocation.endDate).toLocaleDateString()}
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Engineering Insights
          </CardTitle>
          <CardDescription>Key metrics and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Velocity Trend</h4>
              <p className="text-sm text-muted-foreground">
                Track deployment completion rate over time
              </p>
              <div className="mt-2 text-2xl font-bold text-emerald-500">+15%</div>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Bottlenecks</h4>
              <p className="text-sm text-muted-foreground">
                {blockedDeployments > 0
                  ? `${blockedDeployments} deployment(s) currently blocked`
                  : "No blocked deployments"}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Capacity Forecast</h4>
              <p className="text-sm text-muted-foreground">
                {utilizationPercent > 80
                  ? "Consider increasing capacity for upcoming sprints"
                  : "Capacity levels are healthy"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
