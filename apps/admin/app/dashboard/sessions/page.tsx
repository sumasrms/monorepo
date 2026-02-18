"use client";

import {
  useSessions,
  useAcademicSettings,
  useCreateSession,
  useActivateSession,
} from "@/lib/graphql/session-hooks";

import {
  Calendar,
  Plus,
  Clock,
  ShieldCheck,
  AlertCircle,
  Settings2,
  Power,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@workspace/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { toast } from "sonner";

export default function AdminSessionsPage() {
  const { data: sessionsData, isLoading: sessionsLoading } = useSessions();
  const { data: settingsData, isLoading: settingsLoading } =
    useAcademicSettings();
  const createSession = useCreateSession();
  const activateSession = useActivateSession();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    session: "",
    startDate: "",
    endDate: "",
  });

  const sessions = sessionsData?.getAllSessions || [];
  const currentSettings = settingsData?.getAcademicSettings;

  const handleCreateSession = async () => {
    try {
      await createSession.mutateAsync({
        session: newSession.session,
        startDate: new Date(newSession.startDate),
        endDate: new Date(newSession.endDate),
      });
      setIsModalOpen(false);
      toast.success("Academic session created successfully");
    } catch {
      toast.error("Failed to create session");
    }
  };

  const handleActivate = async (sessionId: string, semester: string) => {
    try {
      await activateSession.mutateAsync({ sessionId, semester });
      toast.success(`Academic session updated to ${semester} Semester`);
    } catch {
      toast.error("Failed to update session context");
    }
  };

  if (sessionsLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Academic Session Management
          </h1>
          <p className="text-muted-foreground font-medium">
            Control the university&apos;s active academic lifecycle and context
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg hover:shadow-xl transition-all font-bold">
              <Plus className="h-4 w-4" />
              New Academic Session
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Create New Session
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="session" className="font-bold">
                  Session Name (e.g., 2024/2025)
                </Label>
                <Input
                  id="session"
                  placeholder="2024/2025"
                  value={newSession.session}
                  onChange={(e) =>
                    setNewSession({ ...newSession, session: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate" className="font-bold">
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newSession.startDate}
                    onChange={(e) =>
                      setNewSession({
                        ...newSession,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate" className="font-bold">
                    End Date
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newSession.endDate}
                    onChange={(e) =>
                      setNewSession({ ...newSession, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateSession}
                disabled={createSession.isPending}
              >
                Save Session
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Current Active Context Card */}
        <Card className="md:col-span-1 border-primary/20 bg-primary/5 shadow-inner">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary font-black uppercase tracking-wider text-xs">
              <ShieldCheck className="h-4 w-4" />
              Active Context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-1">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
                Active Session
              </p>
              <h2 className="text-4xl font-black tracking-tighter text-primary">
                {currentSettings?.currentSession?.session || "None"}
              </h2>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
                Current Semester
              </p>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-white border border-primary/20 rounded-full text-sm font-black text-primary shadow-sm">
                  {currentSettings?.currentSemester || "N/A"} SEMESTER
                </span>
              </div>
            </div>
            <div className="pt-4 border-t border-primary/10">
              <div className="flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-100">
                <Power className="h-3 w-3" />
                System is currently accepting result uploads for{" "}
                {currentSettings?.currentSession?.session}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions List */}
        <Card className="md:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="font-bold">
              Historical & Planned Sessions
            </CardTitle>
            <CardDescription className="font-medium">
              Activate a session to change the operational context for all staff
              and students.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    "flex flex-col lg:flex-row lg:items-center justify-between p-4 rounded-xl border transition-all",
                    session.id === currentSettings?.currentSessionId
                      ? "border-primary bg-primary/5 shadow-md"
                      : "bg-card hover:bg-muted/50",
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "p-3 rounded-lg shadow-sm border",
                        session.id === currentSettings?.currentSessionId
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted",
                      )}
                    >
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg leading-none mb-1">
                        {session.session}
                      </h4>
                      <p className="text-xs text-muted-foreground font-medium">
                        {new Date(session.startDate).toLocaleDateString()} —{" "}
                        {new Date(session.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 lg:mt-0">
                    <Button
                      size="sm"
                      variant={
                        session.id === currentSettings?.currentSessionId &&
                        currentSettings.currentSemester === "FIRST"
                          ? "default"
                          : "outline"
                      }
                      className="font-bold h-9"
                      onClick={() => handleActivate(session.id, "FIRST")}
                      disabled={activateSession.isPending}
                    >
                      1st Semester
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        session.id === currentSettings?.currentSessionId &&
                        currentSettings.currentSemester === "SECOND"
                          ? "default"
                          : "outline"
                      }
                      className="font-bold h-9"
                      onClick={() => handleActivate(session.id, "SECOND")}
                      disabled={activateSession.isPending}
                    >
                      2nd Semester
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Settings Banner */}
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 shadow-sm">
        <div className="flex gap-4">
          <div className="bg-orange-500 text-white p-3 rounded-xl h-fit">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-orange-800">
              Operational Warning
            </h3>
            <p className="text-sm font-medium text-orange-700/80 leading-relaxed max-w-2xl">
              Switching the active session or semester will immediately affect
              all operations university-wide, including result uploads, lecturer
              assignments, and student registrations. Ensure all current session
              operations are finalized before activating a new context.
            </p>
            <div className="pt-4">
              <Button
                variant="outline"
                size="sm"
                className="bg-white border-orange-200 text-orange-700 hover:bg-orange-100 font-bold gap-2"
              >
                <Settings2 className="h-4 w-4" />
                Advanced System Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
