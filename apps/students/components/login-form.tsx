"use client";

import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  useModal,
} from "@workspace/ui/components/ui/animated-modal";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(false);
  const { setOpen } = useModal();
  const [modalType, setModalType] = useState<"success" | "error" | "info">(
    "info",
  );
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    await authClient.signIn.email({
      email,
      password,
      callbackURL: "/",
      fetchOptions: {
        onRequest: () => {
          setIsLoading(true);
        },
        onResponse: () => {
          setIsLoading(false);
        },
        onSuccess: () => {
          setModalType("success");
          setModalTitle("Welcome Back!");
          setModalMessage("Login successful. Taking you to your dashboard...");
          setOpen(true);
          setTimeout(() => {
            window.location.href = "/";
          }, 1500);
        },
        onError: (err) => {
          setModalType("error");
          setModalTitle("Opps!!!");
          setModalMessage(
            err.error.message ||
              "Login failed. Please check your credentials and try again.",
          );
          setOpen(true);
          setIsLoading(false);
        },
      },
    });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold">Login to your account</h1>
            <p className="text-muted-foreground text-sm text-balance">
              Enter your email below to login to your account
            </p>
          </div>

          <Field className="mt-4">
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </Field>
          <Field>
            <div className="flex items-center">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Link
                href="/forgot-password"
                className="ml-auto text-sm underline-offset-4 hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </Field>
          <Field>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </Field>
          <FieldSeparator>Or continue with</FieldSeparator>
          <Field>
            <FieldDescription className="text-center">
              Don&apos;t have an account?{" "}
              <a href="#" className="underline underline-offset-4">
                Request access
              </a>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>

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
        </ModalContent>
        <ModalFooter className="flex gap-4 sm:justify-center p-6">
          <Button
            variant={modalType === "error" ? "destructive" : "default"}
            onClick={() => setOpen(false)}
            className="min-w-[120px]"
          >
            {modalType === "error" ? "Try Again" : "Close"}
          </Button>
        </ModalFooter>
      </ModalBody>
    </div>
  );
}
