import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { configAPI } from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "@/contexts/ThemeContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Settings,
  Loader2,
  User,
  Palette,
  Bell,
  Shield,
  Database,
  Save,
} from "lucide-react"

export default function SettingsPage() {
  const { user, isAdmin } = useAuth()
  const { theme, setTheme } = useTheme()
  const queryClient = useQueryClient()

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    deploymentAlerts: true,
    approvalRequests: true,
    weeklyDigest: false,
  })

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["config"],
    queryFn: () => configAPI.list(),
    enabled: isAdmin(),
  })

  const updateConfigMutation = useMutation({
    mutationFn: ({ key, value }) => configAPI.update(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config"] })
    },
  })

  const handleProfileSubmit = (e) => {
    e.preventDefault()
    // In production, this would call an API to update the user profile
    alert("Profile update - This would save changes in production")
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (profileData.newPassword !== profileData.confirmPassword) {
      alert("Passwords do not match")
      return
    }
    // In production, this would call an API to change password
    alert("Password change - This would update the password in production")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account and application preferences
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="mr-2 h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          {isAdmin() && (
            <TabsTrigger value="system">
              <Database className="mr-2 h-4 w-4" />
              System
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({ ...profileData, email: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input value={user?.role?.replace("_", " ")} disabled />
                </div>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={profileData.currentPassword}
                    onChange={(e) =>
                      setProfileData({ ...profileData, currentPassword: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={profileData.newPassword}
                      onChange={(e) =>
                        setProfileData({ ...profileData, newPassword: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={profileData.confirmPassword}
                      onChange={(e) =>
                        setProfileData({ ...profileData, confirmPassword: e.target.value })
                      }
                    />
                  </div>
                </div>
                <Button type="submit" variant="outline">
                  Change Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Select your preferred color theme
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(notificationSettings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <Label className="capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {key === "emailNotifications" && "Receive email notifications"}
                      {key === "deploymentAlerts" && "Get alerted about deployment status changes"}
                      {key === "approvalRequests" && "Notify when approvals are requested"}
                      {key === "weeklyDigest" && "Receive weekly summary emails"}
                    </p>
                  </div>
                  <Button
                    variant={value ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setNotificationSettings({ ...notificationSettings, [key]: !value })
                    }
                  >
                    {value ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              ))}
              <Button className="mt-4">
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin() && (
          <TabsContent value="system" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>Manage application-wide settings</CardDescription>
              </CardHeader>
              <CardContent>
                {configLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {config?.rows?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between border-b pb-4">
                        <div>
                          <Label>{item.key}</Label>
                          <p className="text-sm text-muted-foreground">
                            {item.description || "No description"}
                          </p>
                        </div>
                        <Input
                          className="w-48"
                          value={item.value}
                          onChange={(e) => {
                            // Debounced update would be better in production
                          }}
                          onBlur={(e) => {
                            if (e.target.value !== item.value) {
                              updateConfigMutation.mutate({
                                key: item.key,
                                value: e.target.value,
                              })
                            }
                          }}
                        />
                      </div>
                    ))}
                    {(!config?.rows || config.rows.length === 0) && (
                      <p className="text-center text-muted-foreground py-4">
                        No configuration items found
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
