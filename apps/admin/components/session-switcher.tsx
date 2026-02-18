"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Calendar, Clock } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import {
  useSessions,
  useAcademicSettings,
  useActivateSession,
} from "../lib/graphql/session-hooks";

export function SessionSwitcher() {
  const [open, setOpen] = React.useState(false);
  const { data: sessionsData, isLoading: sessionsLoading } = useSessions();
  const { data: settingsData, isLoading: settingsLoading } =
    useAcademicSettings();
  const activateSession = useActivateSession();

  const sessions = sessionsData?.getAllSessions || [];
  const currentSettings = settingsData?.getAcademicSettings;

  const activeSession = sessions.find(
    (s) => s.id === currentSettings?.currentSessionId,
  );
  const currentSemester = currentSettings?.currentSemester;

  if (sessionsLoading || settingsLoading) {
    return (
      <Button
        variant="outline"
        className="w-full justify-start gap-2 opacity-50"
        disabled
      >
        <Clock className="h-4 w-4 animate-spin" />
        <span>Loading session...</span>
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-card hover:bg-accent/50 border-primary/20"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Calendar className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate font-bold">
              {activeSession
                ? `${activeSession.session} - ${currentSemester}`
                : "Select Session"}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0">
        <Command>
          <CommandInput placeholder="Search session..." />
          <CommandList>
            <CommandEmpty>No session found.</CommandEmpty>
            <CommandGroup heading="Active Sessions">
              {sessions.map((session) => (
                <CommandItem
                  key={session.id}
                  value={session.session}
                  onSelect={() => {}}
                  className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold">{session.session}</span>
                    {session.id === currentSettings?.currentSessionId && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={
                        session.id === currentSettings?.currentSessionId &&
                        currentSemester === "FIRST"
                          ? "default"
                          : "outline"
                      }
                      className="h-7 text-[10px] px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        activateSession.mutate({
                          sessionId: session.id,
                          semester: "FIRST",
                        });
                        setOpen(false);
                      }}
                    >
                      1st Semester
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        session.id === currentSettings?.currentSessionId &&
                        currentSemester === "SECOND"
                          ? "default"
                          : "outline"
                      }
                      className="h-7 text-[10px] px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        activateSession.mutate({
                          sessionId: session.id,
                          semester: "SECOND",
                        });
                        setOpen(false);
                      }}
                    >
                      2nd Semester
                    </Button>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
