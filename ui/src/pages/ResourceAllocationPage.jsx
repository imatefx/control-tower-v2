import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { productsAPI, resourceAllocationAPI } from "@/services/api"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Users,
  Search,
  Loader2,
  Clock,
  ChevronRight,
  Package,
} from "lucide-react"

const RESOURCE_ROLES = [
  { code: "FE", name: "Frontend Developer" },
  { code: "BE", name: "Backend Developer" },
  { code: "UX", name: "UX Designer" },
  { code: "DEVOPS", name: "DevOps Engineer" },
  { code: "ARCH", name: "Solution Architect" },
  { code: "PM", name: "Project Manager" },
  { code: "QA", name: "QA/Test Lead" },
  { code: "TL", name: "Team Lead" },
  { code: "PO", name: "Product Owner" },
  { code: "DATA", name: "Data Engineer/Analyst" },
]

const getRoleName = (code) => {
  const role = RESOURCE_ROLES.find(r => r.code === code)
  return role?.name || code
}

function ProductAllocationCard({ product, summary }) {
  const totalHours = summary?.totalHours || 0
  const byRole = summary?.byRole || []

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-cyan-500 to-blue-500" />
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-50">
              <Package className="h-4 w-4 text-cyan-600" />
            </div>
            <h3 className="font-semibold text-lg">{product.name}</h3>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 text-2xl font-bold text-cyan-600">
            <Clock className="h-5 w-5" />
            {totalHours} hours
          </div>
          <p className="text-sm text-muted-foreground">Total allocated</p>
        </div>

        {byRole.length > 0 ? (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Resource breakdown:</p>
            <div className="flex flex-wrap gap-1.5">
              {byRole.map((r) => (
                <span
                  key={r.role}
                  className="px-2 py-1 bg-slate-100 rounded-full text-xs font-medium"
                >
                  {r.role} ({r.count})
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-slate-50 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">No allocations yet</p>
          </div>
        )}

        <Link
          to={`/resource-allocation/${product.id}`}
          className="flex items-center justify-center gap-1 w-full py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
        >
          View Details
          <ChevronRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  )
}

export default function ResourceAllocationPage() {
  const [search, setSearch] = useState("")

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => productsAPI.list({ pageSize: 100 }),
  })

  const { data: summaries, isLoading: summariesLoading } = useQuery({
    queryKey: ["resource-allocation-summaries"],
    queryFn: () => resourceAllocationAPI.getAllSummaries(),
  })

  const isLoading = productsLoading || summariesLoading

  // Filter products by search
  const filteredProducts = products?.rows?.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
              <Users className="h-6 w-6" />
            </div>
            Resource Allocation
          </h1>
          <p className="text-muted-foreground mt-1">Track resource hours allocated per product</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductAllocationCard
              key={product.id}
              product={product}
              summary={summaries?.[product.id]}
            />
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No products found</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
