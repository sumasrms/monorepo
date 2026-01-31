import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function checkAuthRole(role: string, allowedRoles: string[]) {
  return allowedRoles.includes(role);
}
