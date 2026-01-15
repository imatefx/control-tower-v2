import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { usersAPI } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Plus,
  Search,
  UserCog,
  Loader2,
  MoreHorizontal,
  Edit,
  Trash2,
  LayoutGrid,
  List,
  Mail,
  Calendar,
  Shield,
  Crown,
  User,
  Eye,
  Briefcase,
  Target,
  Settings,
  Star,
  Package,
  Award,
} from "lucide-react"

const roles = [
  { value: "admin", label: "Admin" },
  { value: "general_manager", label: "General Manager" },
  { value: "head_of_products", label: "Head of Products" },
  { value: "avp", label: "AVP" },
  { value: "delivery_lead", label: "Delivery Lead" },
  { value: "product_owner", label: "Product Owner" },
  { value: "engineering_manager", label: "Engineering Manager" },
  { value: "user", label: "User" },
  { value: "viewer", label: "Viewer" },
]

const roleColors = {
  admin: "destructive",
  general_manager: "purple",
  head_of_products: "indigo",
  avp: "cyan",
  user: "default",
  viewer: "secondary",
  delivery_lead: "info",
  product_owner: "warning",
  engineering_manager: "success",
}

const roleConfig = {
  admin: {
    color: "bg-gradient-to-r from-red-500 to-rose-500",
    icon: Crown,
    bgLight: "bg-red-50",
    textColor: "text-red-700"
  },
  general_manager: {
    color: "bg-gradient-to-r from-purple-500 to-violet-500",
    icon: Star,
    bgLight: "bg-purple-50",
    textColor: "text-purple-700"
  },
  head_of_products: {
    color: "bg-gradient-to-r from-indigo-500 to-blue-500",
    icon: Package,
    bgLight: "bg-indigo-50",
    textColor: "text-indigo-700"
  },
  avp: {
    color: "bg-gradient-to-r from-cyan-500 to-sky-500",
    icon: Award,
    bgLight: "bg-cyan-50",
    textColor: "text-cyan-700"
  },
  user: {
    color: "bg-gradient-to-r from-blue-500 to-indigo-500",
    icon: User,
    bgLight: "bg-blue-50",
    textColor: "text-blue-700"
  },
  viewer: {
    color: "bg-gradient-to-r from-slate-400 to-slate-500",
    icon: Eye,
    bgLight: "bg-slate-50",
    textColor: "text-slate-700"
  },
  delivery_lead: {
    color: "bg-gradient-to-r from-teal-500 to-emerald-500",
    icon: Briefcase,
    bgLight: "bg-teal-50",
    textColor: "text-teal-700"
  },
  product_owner: {
    color: "bg-gradient-to-r from-amber-500 to-orange-500",
    icon: Target,
    bgLight: "bg-amber-50",
    textColor: "text-amber-700"
  },
  engineering_manager: {
    color: "bg-gradient-to-r from-emerald-500 to-green-500",
    icon: Settings,
    bgLight: "bg-emerald-50",
    textColor: "text-emerald-700"
  },
}

function UserCard({ user, onEdit, onDelete }) {
  const config = roleConfig[user.role] || roleConfig.user
  const RoleIcon = config.icon

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
      <div className={`h-1.5 ${config.color}`} />
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <button
            onClick={() => onEdit(user)}
            className="flex-1 text-left"
          >
            <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-1">
              {user.name}
            </h3>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(user)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(user)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Mail className="h-4 w-4" />
          <span className="truncate">{user.email}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgLight} ${config.textColor}`}>
            <RoleIcon className="h-3 w-3" />
            {user.role?.replace("_", " ")}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(user.createdAt).toLocaleDateString()}
          </div>
        </div>

        <button
          onClick={() => onEdit(user)}
          className="mt-4 w-full text-center text-sm text-primary hover:underline font-medium"
        >
          Edit User
        </button>
      </CardContent>
    </Card>
  )
}

export default function UsersPage() {
  const [search, setSearch] = useState("")
  const [view, setView] = useState("cards")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  })
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", search],
    queryFn: () => usersAPI.list({ search }),
  })

  const createMutation = useMutation({
    mutationFn: usersAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      closeDialog()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => usersAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      closeDialog()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: usersAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingUser(null)
    setFormData({ name: "", email: "", password: "", role: "user" })
  }

  const openEditDialog = (user) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    })
    setDialogOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingUser) {
      const updateData = { ...formData }
      if (!updateData.password) delete updateData.password
      updateMutation.mutate({ id: editingUser.id, data: updateData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (user) => {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      deleteMutation.mutate(user.id)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg text-white">
              <UserCog className="h-6 w-6" />
            </div>
            Users
          </h1>
          <p className="text-muted-foreground">Manage user accounts and roles</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
                <DialogDescription>
                  {editingUser
                    ? "Update user details and role"
                    : "Create a new user account"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password {editingUser && "(leave blank to keep current)"}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingUser ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={view === "cards" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("cards")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : view === "cards" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {users?.rows?.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onEdit={openEditDialog}
                  onDelete={handleDelete}
                />
              ))}
              {(!users?.rows || users.rows.length === 0) && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No users found
                </div>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.rows?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <button
                        onClick={() => openEditDialog(user)}
                        className="hover:text-primary hover:underline transition-colors"
                      >
                        {user.name}
                      </button>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={roleColors[user.role]}>
                        {user.role?.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(user)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {(!users?.rows || users.rows.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
