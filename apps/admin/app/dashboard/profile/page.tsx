"use client";

import { useState, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { useUploadImage } from "@/lib/hooks/useUpload";
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
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { toast } from "sonner";
import {
  User,
  Lock,
  Shield,
  Loader2,
  Camera,
  Smartphone,
  Key,
  Trash2,
  Plus,
  Copy,
} from "lucide-react";
import QRCode from "react-qr-code";

export default function ProfilePage() {
  const { data: session } = authClient.useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: uploadImage, isPending: isUploading } = useUploadImage();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    uploadImage(file, {
      onSuccess: (data) => {
        toast.success("Profile image updated successfully");
        setImagePreview(null);
        // Note: You may need to update the user's image in your database here
        // using a separate mutation to save data.secureUrl to the user record
      },
      onError: (error) => {
        toast.error(`Upload failed: ${error.message}`);
        setImagePreview(null);
      },
    });
  };

  if (!session) {
    return <div className="p-8">Loading profile...</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Profile & Settings
        </h2>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <Card className="w-full md:w-1/4 h-fit border-border/50 shadow-sm sticky top-6">
          <CardHeader className="text-center">
            <div className="w-full flex justify-center mb-4 relative group">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                <AvatarImage
                  src={imagePreview || session.user.image || ""}
                  className={isUploading ? "opacity-50" : ""}
                />
                <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                  {session.user.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              <div className="absolute bottom-0 right-1/2 translate-x-1/2 translate-y-1/4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="secondary"
                  className="rounded-full shadow-md h-8 w-8"
                  onClick={handleImageClick}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Camera size={14} />
                  )}
                </Button>
              </div>
            </div>
            <CardTitle className="text-xl">{session.user.name}</CardTitle>
            <CardDescription>{session.user.email}</CardDescription>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium capitalize">
                {session.user.role || "User"}
              </span>
            </div>
          </CardHeader>
        </Card>

        <div className="flex-1">
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="general" className="gap-2">
                <User size={16} /> General
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Shield size={16} /> Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <GeneralSettings session={session} />
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <SecuritySettings />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function GeneralSettings({ session }: { session: any }) {
  const [name, setName] = useState(session.user.name);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateProfile = async () => {
    setIsLoading(true);
    try {
      await authClient.updateUser({
        name: name,
      });
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle>General Information</CardTitle>
        <CardDescription>Update your personal details here.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={session.user.email}
            disabled
            className="bg-muted text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground">
            Email cannot be changed directly.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleUpdateProfile} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
}

function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (error) {
        toast.error(error.message || "Failed to change password");
      } else {
        toast.success("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Password Change Card */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Change your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="current-password"
                type="password"
                className="pl-9"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type="password"
                  className="pl-9"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type="password"
                  className="pl-9"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            Other sessions will be signed out.
          </p>
          <Button
            onClick={handleChangePassword}
            disabled={isLoading || !currentPassword || !newPassword}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Password
          </Button>
        </CardFooter>
      </Card>

      {/* Two-Factor Authentication Card */}
      <TwoFactorSettings />

      {/* Passkey Management Card */}
      <PasskeySettings />
    </div>
  );
}

function TwoFactorSettings() {
  const { data: session } = authClient.useSession();
  const [passwordFor2FA, setPasswordFor2FA] = useState("");
  const [isEnabling, setIsEnabling] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  const is2FAEnabled = session?.user?.twoFactorEnabled || false;

  const handleEnable2FA = async () => {
    if (!passwordFor2FA) {
      toast.error("Please enter your password");
      return;
    }

    setIsEnabling(true);
    try {
      const { data, error } = await authClient.twoFactor.enable({
        password: passwordFor2FA,
      });

      if (error) {
        toast.error(error.message || "Failed to enable 2FA");
      } else if (data) {
        setTotpUri(data.totpURI);
        setBackupCodes(data.backupCodes || []);
        setShowSetup(true);
        toast.success(
          "2FA setup initiated. Scan the QR code with your authenticator app.",
        );
      }
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setIsEnabling(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setIsVerifying(true);
    try {
      const { data, error } = await authClient.twoFactor.verifyTotp({
        code: verificationCode,
      });

      if (error) {
        toast.error(error.message || "Invalid verification code");
      } else {
        toast.success("2FA enabled successfully!");
        setShowSetup(false);
        setPasswordFor2FA("");
        setVerificationCode("");
        setTotpUri(null);
        setBackupCodes([]);
      }
    } catch (error: any) {
      toast.error(error.message || "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!passwordFor2FA) {
      toast.error("Please enter your password to disable 2FA");
      return;
    }

    setIsDisabling(true);
    try {
      const { error } = await authClient.twoFactor.disable({
        password: passwordFor2FA,
      });

      if (error) {
        toast.error(error.message || "Failed to disable 2FA");
      } else {
        toast.success("2FA disabled successfully");
        setPasswordFor2FA("");
      }
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setIsDisabling(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success("Backup codes copied to clipboard");
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone size={20} />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!is2FAEnabled && !showSetup && (
          <>
            <div className="space-y-2">
              <Label htmlFor="password-2fa">Password</Label>
              <Input
                id="password-2fa"
                type="password"
                placeholder="Enter your password"
                value={passwordFor2FA}
                onChange={(e) => setPasswordFor2FA(e.target.value)}
              />
            </div>
            <Button onClick={handleEnable2FA} disabled={isEnabling}>
              {isEnabling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enable 2FA
            </Button>
          </>
        )}

        {showSetup && totpUri && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4 p-4 border rounded-lg">
              <p className="text-sm text-center">
                Scan this QR code with your authenticator app (Google
                Authenticator, Authy, etc.)
              </p>
              <div className="bg-white p-4 rounded-lg">
                <QRCode value={totpUri} size={200} />
              </div>
            </div>

            {backupCodes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Backup Codes</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyBackupCodes}
                    className="gap-2"
                  >
                    <Copy size={14} />
                    Copy
                  </Button>
                </div>
                <div className="p-3 bg-muted rounded-md font-mono text-sm space-y-1">
                  {backupCodes.map((code, idx) => (
                    <div key={idx}>{code}</div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Save these codes in a safe place. You can use them to access
                  your account if you lose your device.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                placeholder="Enter 6-digit code"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
            </div>

            <Button
              onClick={handleVerify2FA}
              disabled={isVerifying || verificationCode.length !== 6}
            >
              {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify & Enable
            </Button>
          </div>
        )}

        {is2FAEnabled && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-md">
              <Shield className="text-green-500" size={20} />
              <span className="text-sm font-medium">2FA is enabled</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password-disable-2fa">Password</Label>
              <Input
                id="password-disable-2fa"
                type="password"
                placeholder="Enter your password to disable"
                value={passwordFor2FA}
                onChange={(e) => setPasswordFor2FA(e.target.value)}
              />
            </div>

            <Button
              variant="destructive"
              onClick={handleDisable2FA}
              disabled={isDisabling}
            >
              {isDisabling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disable 2FA
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PasskeySettings() {
  const [passkeys, setPasskeys] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const loadPasskeys = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await authClient.passkey.listUserPasskeys();
      if (error) {
        toast.error("Failed to load passkeys");
      } else {
        setPasskeys(data || []);
      }
    } catch (error) {
      toast.error("Failed to load passkeys");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPasskey = async () => {
    setIsAdding(true);
    try {
      const { data, error } = await authClient.passkey.addPasskey({
        name: `Passkey ${new Date().toLocaleDateString()}`,
      });

      if (error) {
        toast.error(error.message || "Failed to add passkey");
      } else {
        toast.success("Passkey added successfully");
        loadPasskeys();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to add passkey");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeletePasskey = async (id: string) => {
    try {
      const { error } = await authClient.passkey.deletePasskey({ id });

      if (error) {
        toast.error("Failed to delete passkey");
      } else {
        toast.success("Passkey deleted successfully");
        loadPasskeys();
      }
    } catch (error) {
      toast.error("Failed to delete passkey");
    }
  };

  // Load passkeys on mount
  useState(() => {
    loadPasskeys();
  });

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key size={20} />
          Passkeys
        </CardTitle>
        <CardDescription>
          Manage your passkeys for passwordless sign-in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : passkeys.length > 0 ? (
          <div className="space-y-2">
            {passkeys.map((passkey) => (
              <div
                key={passkey.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Key size={16} className="text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {passkey.name || "Unnamed Passkey"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Added {new Date(passkey.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeletePasskey(passkey.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No passkeys added yet
          </p>
        )}

        <Button
          onClick={handleAddPasskey}
          disabled={isAdding}
          className="w-full gap-2"
        >
          {isAdding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          Add Passkey
        </Button>
      </CardContent>
    </Card>
  );
}
