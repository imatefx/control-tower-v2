import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "@/contexts/ThemeContext"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/useToast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Moon, Sun, User, LogOut, Settings, Rocket, AlertTriangle, Clock, CheckCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { deploymentsAPI } from "@/services/api"

export function Header() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  // Fetch deployments for notifications
  const { data: deployments } = useQuery({
    queryKey: ["deployments-notifications"],
    queryFn: () => deploymentsAPI.list({}),
    refetchInterval: 60000, // Refresh every minute
  })

  // Calculate notification items
  const getNotifications = () => {
    if (!deployments?.rows) return []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return deployments.rows
      .filter(d => d.status !== "Released" && d.nextDeliveryDate)
      .map(d => {
        const deliveryDate = new Date(d.nextDeliveryDate)
        deliveryDate.setHours(0, 0, 0, 0)
        const daysUntil = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24))

        let type = "info"
        let message = ""

        if (daysUntil < 0) {
          type = "overdue"
          message = `${Math.abs(daysUntil)} day(s) overdue`
        } else if (daysUntil === 0) {
          type = "urgent"
          message = "Due today"
        } else if (daysUntil <= 3) {
          type = "warning"
          message = `Due in ${daysUntil} day(s)`
        } else if (daysUntil <= 7) {
          type = "info"
          message = `Due in ${daysUntil} days`
        } else {
          return null
        }

        return {
          id: d.id,
          productName: d.productName,
          type,
          message,
          daysUntil
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 10)
  }

  const notifications = getNotifications()
  const urgentCount = notifications.filter(n => n.type === "overdue" || n.type === "urgent").length

  const handleLogout = () => {
    logout()
    toast.info("You have been logged out")
    navigate("/login")
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case "overdue": return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "urgent": return <Clock className="h-4 w-4 text-orange-500" />
      case "warning": return <Clock className="h-4 w-4 text-yellow-500" />
      default: return <Rocket className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <header className="flex h-16 items-center justify-end border-b bg-card px-6">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className={`absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-white ${urgentCount > 0 ? 'bg-destructive' : 'bg-blue-500'}`}>
                  {notifications.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Deployment Alerts</span>
              {urgentCount > 0 && (
                <span className="text-xs text-destructive">{urgentCount} urgent</span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>No upcoming deployments</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  onClick={() => navigate(`/deployments?id=${notification.id}`)}
                  className="flex items-start gap-3 py-3 cursor-pointer"
                >
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{notification.productName}</p>
                    <p className={`text-xs ${notification.type === 'overdue' ? 'text-red-500' : notification.type === 'urgent' ? 'text-orange-500' : 'text-muted-foreground'}`}>
                      {notification.message}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/deployments")} className="justify-center text-primary">
              View all deployments
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            const newTheme = theme === "dark" ? "light" : "dark"
            setTheme(newTheme)
            toast.info(`Switched to ${newTheme} theme`)
          }}
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <span className="hidden md:inline">{user?.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.name}</span>
                <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
