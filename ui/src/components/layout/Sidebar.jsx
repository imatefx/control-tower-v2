import { NavLink, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import {
  LayoutDashboard,
  Package,
  Users,
  Rocket,
  ClipboardList,
  FileText,
  FlaskConical,
  UserCog,
  Settings,
  ScrollText,
  BarChart3,
  CheckSquare,
  ListChecks,
  Trash2,
  Wrench,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "user", "viewer", "delivery_lead", "product_owner", "engineering_manager"] },
  { name: "Products", href: "/products", icon: Package, roles: ["admin", "user", "viewer", "delivery_lead", "product_owner", "engineering_manager"] },
  { name: "Clients", href: "/clients", icon: Users, roles: ["admin", "user", "viewer", "delivery_lead", "product_owner", "engineering_manager"] },
  { name: "Deployments", href: "/deployments", icon: Rocket, roles: ["admin", "user", "viewer", "delivery_lead", "product_owner", "engineering_manager"] },
  { name: "Onboarding", href: "/onboarding", icon: ClipboardList, roles: ["admin", "user", "delivery_lead"] },
  { name: "Release Notes", href: "/release-notes", icon: FileText, roles: ["admin", "user", "viewer", "delivery_lead", "product_owner", "engineering_manager"] },
  { name: "EAP Dashboard", href: "/eap", icon: FlaskConical, roles: ["admin", "user", "product_owner"] },
  { name: "Engineering", href: "/engineering", icon: Wrench, roles: ["admin", "engineering_manager"] },
  { name: "Users", href: "/users", icon: UserCog, roles: ["admin"] },
  { name: "Approvals", href: "/approvals", icon: CheckSquare, roles: ["admin", "delivery_lead", "product_owner"] },
  { name: "Reports", href: "/reports", icon: BarChart3, roles: ["admin", "delivery_lead", "product_owner", "engineering_manager"] },
  { name: "Audit Logs", href: "/audit", icon: ScrollText, roles: ["admin"] },
  { name: "Checklist Items", href: "/checklist-items", icon: ListChecks, roles: ["admin"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["admin", "user", "viewer", "delivery_lead", "product_owner", "engineering_manager"] },
  { name: "Trash", href: "/trash", icon: Trash2, roles: ["admin"] },
]

export function Sidebar() {
  const { user, hasRole } = useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const filteredNav = navigation.filter(item =>
    item.roles.some(role => hasRole(role))
  )

  return (
    <aside className={cn(
      "flex flex-col border-r bg-card transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <span className="text-lg font-semibold">Control Tower</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(collapsed && "mx-auto")}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/")
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          )
        })}
      </nav>

      {!collapsed && user && (
        <div className="border-t p-4">
          <div className="text-sm font-medium">{user.name}</div>
          <div className="text-xs text-muted-foreground capitalize">{user.role?.replace("_", " ")}</div>
        </div>
      )}
    </aside>
  )
}
