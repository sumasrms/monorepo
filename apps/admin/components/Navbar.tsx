"use client";
import React, { useState } from "react";
import { HoveredLink, Menu, MenuItem } from "@workspace/ui/components/navbar-menu";
import { ModeToggle } from "@workspace/ui/components/mode-toggle";
import { cn } from "@workspace/ui/lib/utils";



export function Navbar({ className }: { className?: string }) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div
      className={cn("fixed top-10 inset-x-0 max-w-2xl mx-auto z-50", className)}
    >
      <Menu setActive={setActive}>
        <MenuItem setActive={setActive} active={active} item="Home">
          <div className="flex flex-col space-y-4 text-sm">
            <HoveredLink href="/">Home</HoveredLink>
          </div>
        </MenuItem>
        <MenuItem setActive={setActive} active={active} item="Support">
          <div className="flex flex-col space-y-4 text-sm">
            <HoveredLink href="/support">Support</HoveredLink>
          </div>
        </MenuItem>
        <MenuItem setActive={setActive} active={active} item="Documentation">
          <div className="flex flex-col space-y-4 text-sm">
            <HoveredLink href="/docs">Documentation</HoveredLink>
          </div>
        </MenuItem>
        <div className="flex items-center justify-center">
          <ModeToggle />
        </div>
      </Menu>
    </div>
  );
}
