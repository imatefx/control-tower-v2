import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Bell,
  Mail,
  MessageSquare,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Users,
  Loader2,
  TestTube,
} from "lucide-react"
import { toast } from "@/hooks/useToast"
import { alertsAPI } from "@/services/api"

/**
 * Alert Configuration Form Component
 *
 * Props:
 * - alertConfig: The current alert configuration object
 * - onChange: (config) => void - Called when configuration changes
 * - deploymentId: Optional - For testing and recipient lookup
 * - showGoogleChat: boolean - Whether to show Google Chat options
 * - showEventConfig: boolean - Whether to show event configuration
 */
export default function AlertConfigForm({
  alertConfig = {},
  onChange,
  deploymentId,
  showGoogleChat = true,
  showEventConfig = true,
}) {
  const [config, setConfig] = useState({
    enabled: true,
    notifyProductOwners: true,
    notifyEngineeringOwners: true,
    notifyDeliveryLead: true,
    additionalEmails: [],
    googleChat: {
      enabled: false,
      webhookUrl: "",
      useProductWebhook: true,
    },
    events: {
      onCreated: true,
      onStatusChange: true,
      onBlocked: true,
      onReleased: true,
      onApproaching: true,
      onOverdue: true,
    },
    ...alertConfig,
  })

  const [newEmail, setNewEmail] = useState("")
  const [eventsOpen, setEventsOpen] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [testingChat, setTestingChat] = useState(false)

  useEffect(() => {
    setConfig({
      enabled: true,
      notifyProductOwners: true,
      notifyEngineeringOwners: true,
      notifyDeliveryLead: true,
      additionalEmails: [],
      googleChat: {
        enabled: false,
        webhookUrl: "",
        useProductWebhook: true,
      },
      events: {
        onCreated: true,
        onStatusChange: true,
        onBlocked: true,
        onReleased: true,
        onApproaching: true,
        onOverdue: true,
      },
      ...alertConfig,
    })
  }, [alertConfig])

  const updateConfig = (updates) => {
    const newConfig = { ...config, ...updates }
    setConfig(newConfig)
    onChange?.(newConfig)
  }

  const updateGoogleChat = (updates) => {
    const newGoogleChat = { ...config.googleChat, ...updates }
    updateConfig({ googleChat: newGoogleChat })
  }

  const updateEvents = (updates) => {
    const newEvents = { ...config.events, ...updates }
    updateConfig({ events: newEvents })
  }

  const addEmail = () => {
    if (!newEmail) return
    if (!newEmail.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }
    if (config.additionalEmails.includes(newEmail)) {
      toast.error("Email already added")
      return
    }
    updateConfig({
      additionalEmails: [...config.additionalEmails, newEmail],
    })
    setNewEmail("")
  }

  const removeEmail = (email) => {
    updateConfig({
      additionalEmails: config.additionalEmails.filter((e) => e !== email),
    })
  }

  const handleTestEmail = async () => {
    const email = prompt("Enter email address to send test notification:")
    if (!email) return

    setTestingEmail(true)
    try {
      await alertsAPI.testEmail(email)
      toast.success("Test email sent successfully")
    } catch (error) {
      toast.error("Failed to send test email: " + (error.message || "Unknown error"))
    } finally {
      setTestingEmail(false)
    }
  }

  const handleTestGoogleChat = async () => {
    const webhookUrl = config.googleChat.webhookUrl
    if (!webhookUrl) {
      toast.error("Please enter a Google Chat webhook URL first")
      return
    }

    setTestingChat(true)
    try {
      await alertsAPI.testGoogleChat(webhookUrl)
      toast.success("Test message sent to Google Chat")
    } catch (error) {
      toast.error("Failed to send test message: " + (error.message || "Unknown error"))
    } finally {
      setTestingChat(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Master Enable */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-blue-500" />
          <div>
            <Label className="font-medium">Enable Alerts</Label>
            <p className="text-xs text-muted-foreground">
              Send notifications for deployment events
            </p>
          </div>
        </div>
        <Checkbox
          checked={config.enabled}
          onCheckedChange={(checked) => updateConfig({ enabled: checked })}
        />
      </div>

      {config.enabled && (
        <>
          {/* Recipient Configuration */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Recipients
              </CardTitle>
              <CardDescription>
                Choose who receives deployment alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Role-based recipients */}
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm">Product Owners</span>
                  <Checkbox
                    checked={config.notifyProductOwners}
                    onCheckedChange={(checked) =>
                      updateConfig({ notifyProductOwners: checked })
                    }
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm">Engineering Owners</span>
                  <Checkbox
                    checked={config.notifyEngineeringOwners}
                    onCheckedChange={(checked) =>
                      updateConfig({ notifyEngineeringOwners: checked })
                    }
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm">Delivery Lead</span>
                  <Checkbox
                    checked={config.notifyDeliveryLead}
                    onCheckedChange={(checked) =>
                      updateConfig({ notifyDeliveryLead: checked })
                    }
                  />
                </label>
              </div>

              {/* Additional Emails */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Additional Email Recipients</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addEmail())}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addEmail}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {config.additionalEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {config.additionalEmails.map((email) => (
                      <Badge
                        key={email}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => removeEmail(email)}
                          className="ml-1 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Test Email Button */}
              <div className="border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestEmail}
                  disabled={testingEmail}
                >
                  {testingEmail ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Send Test Email
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Google Chat Configuration */}
          {showGoogleChat && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Google Chat
                </CardTitle>
                <CardDescription>
                  Send alerts to a Google Chat space
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium">Enable Google Chat Alerts</span>
                  <Checkbox
                    checked={config.googleChat.enabled}
                    onCheckedChange={(checked) =>
                      updateGoogleChat({ enabled: checked })
                    }
                  />
                </label>

                {config.googleChat.enabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="webhookUrl">Webhook URL</Label>
                      <Input
                        id="webhookUrl"
                        type="url"
                        placeholder="https://chat.googleapis.com/v1/spaces/..."
                        value={config.googleChat.webhookUrl || ""}
                        onChange={(e) =>
                          updateGoogleChat({ webhookUrl: e.target.value })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave empty to use product or global default webhook
                      </p>
                    </div>

                    <label className="flex items-center justify-between">
                      <span className="text-sm">Use Product Default Webhook</span>
                      <Checkbox
                        checked={config.googleChat.useProductWebhook}
                        onCheckedChange={(checked) =>
                          updateGoogleChat({ useProductWebhook: checked })
                        }
                      />
                    </label>

                    {config.googleChat.webhookUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleTestGoogleChat}
                        disabled={testingChat}
                      >
                        {testingChat ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <TestTube className="h-4 w-4 mr-2" />
                        )}
                        Send Test Message
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Event Configuration */}
          {showEventConfig && (
            <Collapsible open={eventsOpen} onOpenChange={setEventsOpen}>
              <CollapsibleTrigger asChild>
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Event Triggers
                      </CardTitle>
                      {eventsOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <CardDescription>
                      Configure which events trigger alerts
                    </CardDescription>
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card className="mt-2 border-t-0 rounded-t-none">
                  <CardContent className="pt-4 space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-sm">On Deployment Created</span>
                      <Checkbox
                        checked={config.events.onCreated}
                        onCheckedChange={(checked) =>
                          updateEvents({ onCreated: checked })
                        }
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm">On Status Change</span>
                      <Checkbox
                        checked={config.events.onStatusChange}
                        onCheckedChange={(checked) =>
                          updateEvents({ onStatusChange: checked })
                        }
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm">On Blocked</span>
                      <Checkbox
                        checked={config.events.onBlocked}
                        onCheckedChange={(checked) =>
                          updateEvents({ onBlocked: checked })
                        }
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm">On Released</span>
                      <Checkbox
                        checked={config.events.onReleased}
                        onCheckedChange={(checked) =>
                          updateEvents({ onReleased: checked })
                        }
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm">On Approaching Deadline</span>
                      <Checkbox
                        checked={config.events.onApproaching}
                        onCheckedChange={(checked) =>
                          updateEvents({ onApproaching: checked })
                        }
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm">On Overdue</span>
                      <Checkbox
                        checked={config.events.onOverdue}
                        onCheckedChange={(checked) =>
                          updateEvents({ onOverdue: checked })
                        }
                      />
                    </label>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          )}
        </>
      )}
    </div>
  )
}
