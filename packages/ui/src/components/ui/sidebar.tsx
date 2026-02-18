"use client";
import { cn } from "@workspace/ui/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconChevronDown, IconMenu2, IconX } from "@tabler/icons-react";

const normalizePath = (path?: string) => {
  if (!path) return "";
  if (path === "/") return "/";
  return path.replace(/\/+$/, "");
};

const isPathActive = (href: string | undefined, pathname: string) => {
  if (!href) return false;

  const normalizedHref = normalizePath(href);
  const normalizedPathname = normalizePath(pathname);

  if (normalizedHref === "/") {
    return normalizedPathname === "/";
  }

  if (normalizedHref === "/dashboard") {
    return normalizedPathname === "/dashboard";
  }

  return (
    normalizedPathname === normalizedHref ||
    normalizedPathname.startsWith(`${normalizedHref}/`)
  );
};

const hasActiveDescendant = (link: Links, pathname: string): boolean => {
  if (!link.children?.length) return false;

  return link.children.some(
    (child) => isPathActive(child.href, pathname) || hasActiveDescendant(child, pathname),
  );
};

export interface Links {
  label: string;
  href?: string;
  icon?: React.JSX.Element | React.ReactNode;
  children?: Links[];
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined,
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <>
      <motion.div
        className={cn(
          "h-full px-4 py-4 hidden md:flex md:flex-col bg-sidebar w-[300px] shrink-0",
          className,
        )}
        animate={{
          width: animate ? (open ? "300px" : "60px") : "300px",
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-sidebar text-sidebar-foreground w-full",
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <IconMenu2
            className="text-sidebar-foreground"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-sidebar text-sidebar-foreground p-10 z-[100] flex flex-col justify-between",
                className,
              )}
            >
              <div
                className="absolute right-10 top-10 z-50 text-sidebar-foreground"
                onClick={() => setOpen(!open)}
              >
                <IconX />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarSection = ({
  label,
  children,
  className,
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const { open, animate } = useSidebar();
  return (
    <div className={cn("flex flex-col gap-1 mt-4", className)}>
      {label && (
        <motion.span
          animate={{
            display: animate ? (open ? "block" : "none") : "block",
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider px-2 mb-1"
        >
          {label}
        </motion.span>
      )}
      {children}
    </div>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
}) => {
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";
  const { open, animate } = useSidebar();
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = link.children && link.children.length > 0;
  const selfActive = isPathActive(link.href, pathname);
  const childActive = hasActiveDescendant(link, pathname);
  const isActive = selfActive || childActive;

  React.useEffect(() => {
    if (hasChildren && childActive) {
      setIsOpen(true);
    }
  }, [hasChildren, childActive]);

  const handleClick = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="flex flex-col">
      <a
        href={link.href || "#"}
        onClick={handleClick}
        className={cn(
          "flex items-center justify-between gap-2 group/sidebar py-2 px-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition duration-150",
          isActive &&
            "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
          className,
        )}
        {...props}
      >
        <div className="flex items-center gap-2">
          {link.icon}
          <motion.span
            animate={{
              display: animate
                ? open
                  ? "inline-block"
                  : "none"
                : "inline-block",
              opacity: animate ? (open ? 1 : 0) : 1,
            }}
            className={cn(
              "text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0",
              isActive
                ? "text-sidebar-accent-foreground"
                : "text-sidebar-foreground",
            )}
          >
            {link.label}
          </motion.span>
        </div>
        {hasChildren && open && (
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <IconChevronDown className="h-4 w-4 text-sidebar-foreground/70" />
          </motion.div>
        )}
      </a>
      {hasChildren && open && (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden flex flex-col pl-6 border-l border-sidebar-border ml-4 mt-1 gap-1"
            >
              {link.children?.map((child, index) => (
                <SidebarLink key={index} link={child} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};
