import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { productsAPI, clientsAPI } from "@/services/api"
import { toast } from "@/hooks/useToast"
import { Checkbox } from "@/components/ui/checkbox"
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
import { ArrowLeft, Package, Loader2, Save } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export default function ProductEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { canEdit } = useAuth()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    productOwner: "",
    engineeringOwner: "",
    parentId: "",
    isEap: false,
    eapJiraBoardUrl: "",
    eapClients: [],  // Array of { clientId, clientName, startDate, endDate }
  })

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsAPI.get(id),
  })

  const { data: mainProducts } = useQuery({
    queryKey: ["products", "main"],
    queryFn: () => productsAPI.list({ type: "main" }),
  })

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: () => clientsAPI.list(),
  })

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        productOwner: product.productOwner || "",
        engineeringOwner: product.engineeringOwner || "",
        parentId: product.parentId || "",
        isEap: product.eap?.isActive || false,
        eapJiraBoardUrl: product.eap?.jiraBoardUrl || "",
        eapClients: product.eap?.clients || [],
      })
    }
  }, [product])

  const updateMutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        parentId: data.parentId || null,
        eap: {
          isActive: data.isEap,
          jiraBoardUrl: data.eapJiraBoardUrl || null,
          clients: data.eapClients || [],
        },
      }
      return productsAPI.update(id, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["product", id] })
      toast.success("Product saved successfully")
      navigate(`/products/${id}`)
    },
    onError: () => {
      toast.error("Failed to save product")
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  const handleEapClientToggle = (clientId, clientName) => {
    const exists = formData.eapClients.find(c => c.clientId === clientId)
    if (exists) {
      setFormData({
        ...formData,
        eapClients: formData.eapClients.filter(c => c.clientId !== clientId)
      })
    } else {
      setFormData({
        ...formData,
        eapClients: [...formData.eapClients, { clientId, clientName, startDate: "", endDate: "" }]
      })
    }
  }

  const handleEapClientDateChange = (clientId, field, value) => {
    setFormData({
      ...formData,
      eapClients: formData.eapClients.map(c =>
        c.clientId === clientId ? { ...c, [field]: value } : c
      )
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Product not found</p>
        <Button asChild className="mt-4">
          <Link to="/products">Back to Products</Link>
        </Button>
      </div>
    )
  }

  if (!canEdit()) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">You don't have permission to edit products</p>
        <Button asChild className="mt-4">
          <Link to={`/products/${id}`}>Back to Product</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/products/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="h-8 w-8" />
            Edit Product
          </h1>
          <p className="text-muted-foreground">{product.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
          <CardDescription>Update the product information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productOwner">Product Owner</Label>
                <Input
                  id="productOwner"
                  value={formData.productOwner}
                  onChange={(e) => setFormData({ ...formData, productOwner: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="engineeringOwner">Engineering Owner</Label>
                <Input
                  id="engineeringOwner"
                  value={formData.engineeringOwner}
                  onChange={(e) => setFormData({ ...formData, engineeringOwner: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentId">Parent Product (optional)</Label>
              <Select
                value={formData.parentId || "none"}
                onValueChange={(value) => setFormData({ ...formData, parentId: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Main Product)</SelectItem>
                  {mainProducts?.rows?.filter(p => p.id !== id).map((prod) => (
                    <SelectItem key={prod.id} value={prod.id}>
                      {prod.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* EAP Section */}
            <div className="space-y-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isEap"
                  checked={formData.isEap}
                  onCheckedChange={(checked) => setFormData({ ...formData, isEap: checked })}
                />
                <Label htmlFor="isEap" className="font-medium">Early Access Program (EAP)</Label>
              </div>

              {formData.isEap && (
                <div className="space-y-4 pl-6 border-l-2 border-purple-300">
                  <div className="space-y-2">
                    <Label htmlFor="eapJiraBoardUrl">Jira Board URL</Label>
                    <Input
                      id="eapJiraBoardUrl"
                      value={formData.eapJiraBoardUrl}
                      onChange={(e) => setFormData({ ...formData, eapJiraBoardUrl: e.target.value })}
                      placeholder="https://jira.example.com/board/..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>EAP Clients</Label>
                    <p className="text-xs text-muted-foreground">Select clients and set their EAP timeline</p>
                    <div className="border rounded-lg p-3 max-h-60 overflow-y-auto space-y-3">
                      {clients?.rows?.map((client) => {
                        const eapClient = formData.eapClients.find(c => c.clientId === client.id)
                        const isSelected = !!eapClient
                        return (
                          <div key={client.id} className="space-y-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleEapClientToggle(client.id, client.name)}
                              />
                              <span className="text-sm font-medium">{client.name}</span>
                            </label>
                            {isSelected && (
                              <div className="grid grid-cols-2 gap-2 pl-7">
                                <div className="space-y-1">
                                  <Label className="text-xs">Start Date</Label>
                                  <Input
                                    type="date"
                                    value={eapClient.startDate || ""}
                                    onChange={(e) => handleEapClientDateChange(client.id, "startDate", e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">End Date</Label>
                                  <Input
                                    type="date"
                                    value={eapClient.endDate || ""}
                                    onChange={(e) => handleEapClientDateChange(client.id, "endDate", e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {(!clients?.rows || clients.rows.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-2">No clients available</p>
                      )}
                    </div>
                    {formData.eapClients.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {formData.eapClients.length} client(s) selected
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" asChild>
                <Link to={`/products/${id}`}>Cancel</Link>
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
