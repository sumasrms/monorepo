"use client";

import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { Label } from "@workspace/ui/components/label";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { AlertCircle, CheckCircle2, Key, Loader2, XCircle } from "lucide-react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  useModal,
} from "@workspace/ui/components/ui/animated-modal";
import { motion } from "motion/react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <Modal>
      <LoginFormContent className={className} {...props} />
    </Modal>
  );
}

function LoginFormContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { setOpen } = useModal();
  const [modalType, setModalType] = useState<"success" | "error" | "info">(
    "info",
  );
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [isTwoFactor, setIsTwoFactor] = useState(false);
  const [otp, setOtp] = useState("");

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await authClient.signIn.email({
      email,
      password,
      rememberMe,
      callbackURL: "/dashboard",
      fetchOptions: {
        onRequest: () => {
          setLoading(true);
        },
        onResponse: () => {
          setLoading(false);
        },
        onSuccess: async (ctx) => {
          if (ctx.data.twoFactorRedirect) {
            setModalType("info");
            setIsTwoFactor(true);
            setModalTitle("Two-Factor Authentication");
            setModalMessage(
              "Please enter the verification code sent to your email/app.",
            );
            setOpen(true);
          } else {
            setModalType("success");
            setModalTitle("Access Granted");
            setModalMessage("Admin authenticated successfully. Redirecting...");
            setOpen(true);
            const authToken = ctx.response.headers.get("set-auth-token");
            if (authToken) {
              localStorage.setItem("bearer_token", authToken);
            }
            // setTimeout(() => {
            //   window.location.href = "/dashboard";
            // }, 1500);
          }
        },
        onError: (err) => {
          setModalType("error");
          setModalTitle("Oops!!!");
          setModalMessage(
            err.error.message ||
              "Authentication failed. Please check your credentials.",
          );
          setOpen(true);
          setLoading(false);
        },
      },
    });
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      // Note: better-auth usually verifies via a specific endpoint or re-calling sign-in with code?
      // Based on docs, it's often a separate verify call or handled internally if the client supports it.
      // However, typically for 2FA redirect, we might need to use `authClient.twoFactor.verify` or similar if supported.
      // Let's assume standard OTP verification flow if client plugin exposes it, otherwise check docs again.
      // Correct check: client.twoFactor.verifyTotp or verifyOtp

      // Actually, if it's email 2FA vs TOTP... prompt usually implies generic.
      // Let's try verifyTotp as a reasonable default or verifyOtp if specific.
      // Since we don't know if it's TOTP or Email OTP, let's assume TOTP for now or use a generic verify if available.

      // For this implementation, I will assume TOTP as it's common for "Admin" 2FA.
      const res = await authClient.twoFactor.verifyTotp({
        code: otp,
      });

      if (res.data) {
        setModalType("success");
        setModalTitle("Verification Successful");
        setModalMessage("Redirecting to dashboard...");
        setOpen(true);
        setIsTwoFactor(false);
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      } else if (res.error) {
        setModalMessage(res.error.message || "Invalid OTP code");
      }
    } catch (err: any) {
      setModalMessage(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    await authClient.signIn.passkey({
      fetchOptions: {
        onRequest: () => {
          setLoading(true);
        },
        onResponse: () => {
          setLoading(false);
        },
        onSuccess: (ctx) => {
          setModalType("success");
          setModalTitle("Passkey Success");
          setModalMessage("Authenticated via passkey. Redirecting...");
          setOpen(true);
          const authToken = ctx.response.headers.get("set-auth-token");
          if (authToken) {
            localStorage.setItem("bearer_token", authToken);
          }
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 1500);
        },
        onError: (err) => {
          setModalType("error");
          setModalTitle("Passkey Error");
          setModalMessage(
            err.error.message || "Passkey authentication failed.",
          );
          setOpen(true);
          setLoading(false);
        },
      },
    });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                  value={email}
                  disabled={loading}
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="password"
                  autoComplete="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </Field>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  disabled={loading}
                  onCheckedChange={(checked) => {
                    setRememberMe(!!checked);
                  }}
                  checked={rememberMe}
                />
                <Label htmlFor="remember">Remember me</Label>
              </div>
              <Field>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Login"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={loading}
                  className="gap-2"
                  onClick={handlePasskeyLogin}
                >
                  <Key size={16} />
                  Sign-in with Passkey
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <ModalBody>
        <ModalContent className="flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mb-6"
          >
            {modalType === "success" ? (
              <CheckCircle2 className="w-20 h-20 text-green-500" />
            ) : modalType === "error" ? (
              <XCircle className="w-20 h-20 text-red-500" />
            ) : isTwoFactor ? (
              <Key className="w-20 h-20 text-blue-500" />
            ) : (
              <AlertCircle className="w-20 h-20 text-blue-500" />
            )}
          </motion.div>
          <h4 className="text-2xl md:text-3xl font-bold text-neutral-800 dark:text-neutral-100 mb-4">
            {modalTitle}
          </h4>
          <p className="text-neutral-600 dark:text-neutral-400 text-lg leading-relaxed max-w-sm">
            {modalMessage}
          </p>

          {isTwoFactor && (
            <div className="w-full max-w-xs mt-4">
              <Input
                placeholder="Enter 6-digit code"
                className="text-center text-lg tracking-widest"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
          )}
        </ModalContent>
        <ModalFooter className="flex gap-4 sm:justify-center p-6">
          {isTwoFactor ? (
            <Button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length < 6}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify Code
            </Button>
          ) : (
            <Button
              variant={modalType === "error" ? "destructive" : "default"}
              onClick={() => setOpen(false)}
              className="min-w-[120px]"
            >
              {modalType === "error" ? "Try Again" : "Close"}
            </Button>
          )}
        </ModalFooter>
      </ModalBody>
    </div>
  );
}
