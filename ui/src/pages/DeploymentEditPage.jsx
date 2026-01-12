import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { deploymentsAPI, productsAPI, clientsAPI } from "@/services/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Rocket, Loader2, Save } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

const environments = ["production", "sandbox", "qa"]
const statuses = ["Not Started", "In Progress", "Blocked", "Released"]
const deploymentTypes = ["ga", "eap", "feature-release", "client-specific"]

export default function DeploymentEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { canEdit } = useAuth()

  const [formData, setFormData] = useState({
    productId: "",
    clientId: "",
    environment: "production",
    status: "Not Started",
    deploymentType: "ga",
    featureName: "",
    releaseItems: "",
    notes: "",
    version: "",
  })

  const { data: deployment, isLoading } = useQuery({
    queryKey: ["deployment", id],
    queryFn: () => deploymentsAPI.get(id),
  })

  const { data: products } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => productsAPI.list({ pageSize: 100 }),
  })

  const { data: clients } = useQuery({
    queryKey: ["clients-all"],
    queryFn: () => clientsAPI.list({ pageSize: 100 }),
  })

  useEffect(() => {
    if (deployment) {
      setFormData({
        productId: deployment.productId || "",
        clientId: deployment.clientId || "",
        environment: deployment.environment || "production",
        status: deployment.status || "Not Started",
        deploymentType: deployment.deploymentType || "ga",
        featureName: deployment.featureName || "",
        releaseItems: deployment.releaseItems || "",
        notes: typeof deployment.notes === "string" ? deployment.notes : "",
        version: deployment.version || "",
      })
    }
  }, [deployment])

  const updateMutation = useMutation({
    mutationFn: (data) => deploymentsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] })
      queryClient.invalidateQueries({ queryKey: ["deployment", id] })
      navigate(`/deployments/${id}`)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    updateMutation.mutate(formData)
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

  if (!canEdit()) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">You don't have permission to edit deployments</p>
        <Button asChild className="mt-4">
          <Link to={`/deployments/${id}`}>Back to Deployment</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/deployments/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Rocket className="h-8 w-8" />
            Edit Deployment
          </h1>
          <p className="text-muted-foreground">
            {deployment.productName} for {deployment.clientName}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deployment Details</CardTitle>
          <CardDescription>Update the deployment information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productId">Product</Label>
                <Select
                  value={formData.productId}
                  onValueChange={(value) => setFormData({ ...formData, productId: value })}
                  disabled
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
                <p className="text-xs text-muted-foreground">Product cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientId">Client</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                  disabled
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
                <p className="text-xs text-muted-foreground">Client cannot be changed</p>
              </div>
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
                        {env === "qa" ? "QA" : env.charAt(0).toUpperCase() + env.slice(1)}
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
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deploymentType">Deployment Type</Label>
                <Select
                  value={formData.deploymentType}
                  onValueChange={(value) => setFormData({ ...formData, deploymentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {deploymentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type === "ga" ? "GA" : type === "eap" ? "EAP" : type.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="e.g., 1.0.0"
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
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" asChild>
                <Link to={`/deployments/${id}`}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
