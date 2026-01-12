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
  Zap,
  LogOut,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

const navigationGroups = [
  {
    label: "MODULES",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "user", "viewer", "delivery_lead", "product_owner", "engineering_manager"] },
      { name: "Products", href: "/products", icon: Package, roles: ["admin", "user", "viewer", "delivery_lead", "product_owner", "engineering_manager"] },
      { name: "Clients", href: "/clients", icon: Users, roles: ["admin", "user", "viewer", "delivery_lead", "product_owner", "engineering_manager"] },
      { name: "Deployments", href: "/deployments", icon: Rocket, roles: ["admin", "user", "viewer", "delivery_lead", "product_owner", "engineering_manager"] },
      { name: "Onboarding", href: "/onboarding", icon: ClipboardList, roles: ["admin", "user", "delivery_lead"] },
      { name: "Release Notes", href: "/release-notes", icon: FileText, roles: ["admin", "user", "viewer", "delivery_lead", "product_owner", "engineering_manager"] },
      { name: "EAP Dashboard", href: "/eap", icon: FlaskConical, roles: ["admin", "user", "product_owner"], badge: "EAP" },
    ]
  },
  {
    label: "SYSTEM",
    items: [
      { name: "Engineering", href: "/engineering", icon: Wrench, roles: ["admin", "engineering_manager"] },
      { name: "Users", href: "/users", icon: UserCog, roles: ["admin"] },
      { name: "Approvals", href: "/approvals", icon: CheckSquare, roles: ["admin", "delivery_lead", "product_owner"] },
      { name: "Reports", href: "/reports", icon: BarChart3, roles: ["admin", "delivery_lead", "product_owner", "engineering_manager"] },
      { name: "Audit Logs", href: "/audit", icon: ScrollText, roles: ["admin"] },
      { name: "Checklist Items", href: "/checklist-items", icon: ListChecks, roles: ["admin"] },
      { name: "Settings", href: "/settings", icon: Settings, roles: ["admin", "user", "viewer", "delivery_lead", "product_owner", "engineering_manager"] },
      { name: "Trash", href: "/trash", icon: Trash2, roles: ["admin"] },
    ]
  }
]

export function Sidebar() {
  const { user, hasRole, logout } = useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const filteredGroups = navigationGroups.map(group => ({
    ...group,
    items: group.items.filter(item => item.roles.some(role => hasRole(role)))
  })).filter(group => group.items.length > 0)

  return (
    <aside className={cn(
      "flex flex-col bg-slate-900 text-white transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm">iia</span>
              <span className="text-slate-400 text-sm ml-1">elements</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
            <Zap className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-700">
        {filteredGroups.map((group, groupIndex) => (
          <div key={group.label} className={cn(groupIndex > 0 && "mt-6")}>
            {!collapsed && (
              <div className="px-4 mb-2">
                <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                  {group.label}
                </span>
              </div>
            )}
            <div className="space-y-0.5 px-2">
              {group.items.map((item) => {
                const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/")
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white",
                      collapsed && "justify-center px-2"
                    )}
                    title={collapsed ? item.name : undefined}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 flex-shrink-0 transition-colors",
                      isActive ? "text-white" : "text-slate-500"
                    )} />
                    {!collapsed && (
                      <span className="flex-1">{item.name}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-purple-500/20 text-purple-400">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Version & Collapse Toggle */}
      <div className="px-2 py-2 border-t border-slate-800">
        {!collapsed && (
          <div className="text-center mb-2">
            <span className="text-[10px] text-slate-500">v1.1.0</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full justify-center text-slate-400 hover:text-white hover:bg-slate-800",
            collapsed && "px-2"
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
        </Button>
      </div>

      {/* User Profile */}
      {user && (
        <div className={cn(
          "border-t border-slate-800 p-3",
          collapsed ? "flex justify-center" : ""
        )}>
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{user.name}</div>
                <div className="text-xs text-slate-500 capitalize truncate">
                  {user.role?.replace("_", " ")}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="text-slate-500 hover:text-white hover:bg-slate-800 h-8 w-8"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm cursor-pointer"
              title={user.name}
            >
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
