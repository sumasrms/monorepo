"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@workspace/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import { toast } from "sonner";
import {
  Settings2,
  Globe,
  Monitor,
  Bell,
  Shield,
  Loader2,
  Trash2,
  Smartphone,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  useSettingsByCategory,
  useUpdateMultipleSettings,
  settingsToMap,
} from "@/lib/hooks/useSettings";

export default function SettingsPage() {
  return (
    <div className="flex-1 space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
          <p className="text-muted-foreground">
            Manage system-wide configurations and preferences
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
          <TabsTrigger value="general" className="gap-2">
            <Settings2 size={16} />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <Smartphone size={16} />
            <span className="hidden sm:inline">Sessions</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Monitor size={16} />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell size={16} />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield size={16} />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="sessions">
          <SessionManagement />
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceSettings />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GeneralSettings() {
  const [appName] = useState("SUMAS Admin Portal");
  const [timezone, setTimezone] = useState("Africa/Lagos");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [academicYear, setAcademicYear] = useState("2024/2025");

  const { data: settings, isLoading: loadingSettings } =
    useSettingsByCategory("general");
  const { mutate: updateMultiple, isPending } = useUpdateMultipleSettings();

  useEffect(() => {
    if (settings) {
      const map = settingsToMap(settings);
      if (map.timezone) setTimezone(map.timezone);
      if (map.dateFormat) setDateFormat(map.dateFormat);
      if (map.academicYear) setAcademicYear(map.academicYear);
    }
  }, [settings]);

  const handleSave = () => {
    updateMultiple(
      [
        { key: "timezone", value: timezone, category: "general" },
        { key: "dateFormat", value: dateFormat, category: "general" },
        { key: "academicYear", value: academicYear, category: "general" },
      ],
      {
        onSuccess: () => {
          toast.success("General settings saved successfully");
        },
        onError: () => {
          toast.error("Failed to save settings");
        },
      },
    );
  };

  if (loadingSettings) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe size={20} />
          General Configuration
        </CardTitle>
        <CardDescription>
          System-wide settings for the application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="app-name">Application Name</Label>
          <Input id="app-name" value={appName} disabled className="bg-muted" />
          <p className="text-xs text-muted-foreground">
            Application name is managed by system administrator
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Default Timezone</Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger id="timezone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Africa/Lagos">
                Africa/Lagos (WAT, UTC+1)
              </SelectItem>
              <SelectItem value="UTC">UTC (GMT, UTC+0)</SelectItem>
              <SelectItem value="America/New_York">
                America/New York (EST, UTC-5)
              </SelectItem>
              <SelectItem value="Europe/London">
                Europe/London (GMT, UTC+0)
              </SelectItem>
              <SelectItem value="Asia/Dubai">
                Asia/Dubai (GST, UTC+4)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date-format">Date Format</Label>
          <Select value={dateFormat} onValueChange={setDateFormat}>
            <SelectTrigger id="date-format">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="academic-year">Current Academic Year</Label>
          <Input
            id="academic-year"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            placeholder="2024/2025"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save General Settings
        </Button>
      </CardFooter>
    </Card>
  );
}

function SessionManagement() {
  const { data: session } = authClient.useSession();
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionTimeout, setSessionTimeout] = useState("30");

  const { data: settings, isLoading: loadingSettings } =
    useSettingsByCategory("session");
  const { mutate: updateMultiple, isPending } = useUpdateMultipleSettings();

  useEffect(() => {
    if (settings) {
      const map = settingsToMap(settings);
      if (map.sessionTimeout) setSessionTimeout(map.sessionTimeout);
    }
  }, [settings]);

  useEffect(() => {
    // Mock sessions data - in production, fetch from backend
    setSessions([
      {
        id: "current",
        device: "Chrome on Windows",
        ip: "192.168.1.1",
        lastActive: new Date().toISOString(),
        current: true,
      },
    ]);
  }, []);

  const handleRevokeSession = async (sessionId: string) => {
    toast.info("Session revocation would be handled by backend");
  };

  const handleSaveTimeout = () => {
    updateMultiple(
      [{ key: "sessionTimeout", value: sessionTimeout, category: "session" }],
      {
        onSuccess: () => {
          toast.success("Session timeout updated");
        },
        onError: () => {
          toast.error("Failed to update timeout");
        },
      },
    );
  };

  if (loadingSettings) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone size={20} />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Manage your active login sessions across devices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center gap-2">
                  {sess.device}
                  {sess.current && (
                    <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  IP: {sess.ip} • Last active:{" "}
                  {new Date(sess.lastActive).toLocaleString()}
                </p>
              </div>
              {!sess.current && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevokeSession(sess.id)}
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session Configuration</CardTitle>
          <CardDescription>
            Configure session timeout and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
            <Input
              id="session-timeout"
              type="number"
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(e.target.value)}
              min="5"
              max="1440"
            />
            <p className="text-xs text-muted-foreground">
              Users will be logged out after this period of inactivity
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveTimeout} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Session Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const [sidebarDefault, setSidebarDefault] = useState("open");
  const [compactMode, setCompactMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedSidebar = localStorage.getItem("settings_sidebarDefault");
    const savedCompact = localStorage.getItem("settings_compactMode");

    if (savedSidebar) setSidebarDefault(savedSidebar);
    if (savedCompact) setCompactMode(savedCompact === "true");
  }, []);

  const handleSave = () => {
    setIsLoading(true);
    try {
      localStorage.setItem("settings_sidebarDefault", sidebarDefault);
      localStorage.setItem("settings_compactMode", String(compactMode));
      toast.success("Appearance settings saved");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor size={20} />
          Appearance & Display
        </CardTitle>
        <CardDescription>
          Customize the look and feel of the admin portal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Theme</Label>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Choose your preferred color scheme
          </p>
        </div>

        <div className="space-y-2">
          <Label>Default Sidebar State</Label>
          <Select value={sidebarDefault} onValueChange={setSidebarDefault}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Sidebar state when you first load the dashboard
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Compact Mode</Label>
            <p className="text-xs text-muted-foreground">
              Reduce spacing for a more compact interface
            </p>
          </div>
          <Switch checked={compactMode} onCheckedChange={setCompactMode} />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Appearance Settings
        </Button>
      </CardFooter>
    </Card>
  );
}

function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);
  const [newUserAlerts, setNewUserAlerts] = useState(true);
  const [enrollmentAlerts, setEnrollmentAlerts] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const saved = {
      email: localStorage.getItem("settings_emailNotifications"),
      system: localStorage.getItem("settings_systemAlerts"),
      newUser: localStorage.getItem("settings_newUserAlerts"),
      enrollment: localStorage.getItem("settings_enrollmentAlerts"),
      sound: localStorage.getItem("settings_soundEnabled"),
    };

    if (saved.email) setEmailNotifications(saved.email === "true");
    if (saved.system) setSystemAlerts(saved.system === "true");
    if (saved.newUser) setNewUserAlerts(saved.newUser === "true");
    if (saved.enrollment) setEnrollmentAlerts(saved.enrollment === "true");
    if (saved.sound) setSoundEnabled(saved.sound === "true");
  }, []);

  const handleSave = () => {
    setIsLoading(true);
    try {
      localStorage.setItem(
        "settings_emailNotifications",
        String(emailNotifications),
      );
      localStorage.setItem("settings_systemAlerts", String(systemAlerts));
      localStorage.setItem("settings_newUserAlerts", String(newUserAlerts));
      localStorage.setItem(
        "settings_enrollmentAlerts",
        String(enrollmentAlerts),
      );
      localStorage.setItem("settings_soundEnabled", String(soundEnabled));
      toast.success("Notification settings saved");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell size={20} />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Manage how you receive notifications and alerts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Email Notifications</Label>
            <p className="text-xs text-muted-foreground">
              Receive important updates via email
            </p>
          </div>
          <Switch
            checked={emailNotifications}
            onCheckedChange={setEmailNotifications}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>System Alerts</Label>
            <p className="text-xs text-muted-foreground">
              Show in-app notifications for system events
            </p>
          </div>
          <Switch checked={systemAlerts} onCheckedChange={setSystemAlerts} />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>New User Registrations</Label>
            <p className="text-xs text-muted-foreground">
              Get notified when new users register
            </p>
          </div>
          <Switch checked={newUserAlerts} onCheckedChange={setNewUserAlerts} />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Student Enrollment Alerts</Label>
            <p className="text-xs text-muted-foreground">
              Notifications for new student enrollments
            </p>
          </div>
          <Switch
            checked={enrollmentAlerts}
            onCheckedChange={setEnrollmentAlerts}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Notification Sounds</Label>
            <p className="text-xs text-muted-foreground">
              Play sound for notifications
            </p>
          </div>
          <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Notification Settings
        </Button>
      </CardFooter>
    </Card>
  );
}

function SecuritySettings() {
  const [minPasswordLength, setMinPasswordLength] = useState("8");
  const [requireSpecialChar, setRequireSpecialChar] = useState(true);
  const [requireNumbers, setRequireNumbers] = useState(true);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState("5");
  const [lockoutDuration, setLockoutDuration] = useState("30");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const saved = {
      minLength: localStorage.getItem("settings_minPasswordLength"),
      specialChar: localStorage.getItem("settings_requireSpecialChar"),
      numbers: localStorage.getItem("settings_requireNumbers"),
      maxAttempts: localStorage.getItem("settings_maxLoginAttempts"),
      lockout: localStorage.getItem("settings_lockoutDuration"),
    };

    if (saved.minLength) setMinPasswordLength(saved.minLength);
    if (saved.specialChar) setRequireSpecialChar(saved.specialChar === "true");
    if (saved.numbers) setRequireNumbers(saved.numbers === "true");
    if (saved.maxAttempts) setMaxLoginAttempts(saved.maxAttempts);
    if (saved.lockout) setLockoutDuration(saved.lockout);
  }, []);

  const handleSave = () => {
    setIsLoading(true);
    try {
      localStorage.setItem("settings_minPasswordLength", minPasswordLength);
      localStorage.setItem(
        "settings_requireSpecialChar",
        String(requireSpecialChar),
      );
      localStorage.setItem("settings_requireNumbers", String(requireNumbers));
      localStorage.setItem("settings_maxLoginAttempts", maxLoginAttempts);
      localStorage.setItem("settings_lockoutDuration", lockoutDuration);
      toast.success("Security settings saved");
      toast.info("Password policy will apply to new password changes");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield size={20} />
          Security Policies
        </CardTitle>
        <CardDescription>
          Configure password and authentication security policies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 border-b pb-6">
          <h4 className="font-medium">Password Requirements</h4>

          <div className="space-y-2">
            <Label htmlFor="min-password">Minimum Password Length</Label>
            <Input
              id="min-password"
              type="number"
              value={minPasswordLength}
              onChange={(e) => setMinPasswordLength(e.target.value)}
              min="6"
              max="32"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Special Characters</Label>
              <p className="text-xs text-muted-foreground">
                Password must contain at least one special character
              </p>
            </div>
            <Switch
              checked={requireSpecialChar}
              onCheckedChange={setRequireSpecialChar}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Numbers</Label>
              <p className="text-xs text-muted-foreground">
                Password must contain at least one number
              </p>
            </div>
            <Switch
              checked={requireNumbers}
              onCheckedChange={setRequireNumbers}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Login Security</h4>

          <div className="space-y-2">
            <Label htmlFor="max-attempts">Maximum Failed Login Attempts</Label>
            <Input
              id="max-attempts"
              type="number"
              value={maxLoginAttempts}
              onChange={(e) => setMaxLoginAttempts(e.target.value)}
              min="3"
              max="10"
            />
            <p className="text-xs text-muted-foreground">
              Account will be temporarily locked after this many failed attempts
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lockout">Account Lockout Duration (minutes)</Label>
            <Input
              id="lockout"
              type="number"
              value={lockoutDuration}
              onChange={(e) => setLockoutDuration(e.target.value)}
              min="5"
              max="1440"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Security Settings
        </Button>
      </CardFooter>
    </Card>
  );
}
