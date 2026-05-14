"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  User, 
  Settings, 
  LogOut, 
  HelpCircle, 
  Moon, 
  Sun, 
  ChevronDown,
  Shield,
  Bell,
  Keyboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock user data - in production this would come from auth context
const MOCK_USER = {
  name: "Sarah Chen",
  email: "schen@bentoncounty.gov",
  role: "Senior Assessor",
  initials: "SC",
  avatarUrl: null, // No avatar image, will use initials
};

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  shortcut?: string;
  danger?: boolean;
}

export function UserAvatarDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const toggleTheme = () => {
    setIsDark(!isDark);
    // In production, this would update the actual theme
  };

  const menuItems: (MenuItem | "divider")[] = [
    {
      label: "Profile",
      icon: <User className="h-4 w-4" />,
      href: "/settings?tab=profile",
    },
    {
      label: "Notifications",
      icon: <Bell className="h-4 w-4" />,
      href: "/settings?tab=notifications",
    },
    {
      label: "Keyboard Shortcuts",
      icon: <Keyboard className="h-4 w-4" />,
      shortcut: "?",
      onClick: () => {
        setIsOpen(false);
        // Trigger keyboard shortcuts help
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }));
      },
    },
    "divider",
    {
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
      href: "/settings",
    },
    {
      label: "Admin Console",
      icon: <Shield className="h-4 w-4" />,
      href: "/settings?tab=admin",
    },
    {
      label: "Help & Support",
      icon: <HelpCircle className="h-4 w-4" />,
      href: "/help",
    },
    "divider",
    {
      label: "Sign Out",
      icon: <LogOut className="h-4 w-4" />,
      onClick: () => {
        setIsOpen(false);
        // In production, this would sign out the user
        alert("Sign out functionality would be here in production.");
      },
      danger: true,
    },
  ];

  return (
    <div ref={dropdownRef} className="relative">
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
          "hover:bg-accent",
          isOpen && "bg-accent"
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
          {MOCK_USER.initials}
        </div>
        
        {/* Name (hidden on mobile) */}
        <div className="hidden flex-col items-start text-left md:flex">
          <span className="text-sm font-medium text-foreground">{MOCK_USER.name}</span>
          <span className="text-[10px] text-muted-foreground">{MOCK_USER.role}</span>
        </div>

        <ChevronDown className={cn(
          "hidden h-4 w-4 text-muted-foreground transition-transform md:block",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-border bg-card p-2 shadow-xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
          {/* User Info Header */}
          <div className="mb-2 flex items-center gap-3 rounded-lg bg-secondary/30 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
              {MOCK_USER.initials}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-foreground">{MOCK_USER.name}</p>
              <p className="truncate text-xs text-muted-foreground">{MOCK_USER.email}</p>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="mb-2 flex items-center justify-between rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              {isDark ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
              <span className="text-sm text-foreground">Dark Mode</span>
            </div>
            <button
              onClick={toggleTheme}
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors",
                isDark ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                  isDark && "translate-x-4"
                )}
              />
            </button>
          </div>

          {/* Menu Items */}
          <div className="space-y-0.5">
            {menuItems.map((item, index) => {
              if (item === "divider") {
                return <div key={index} className="my-2 h-px bg-border" />;
              }

              const content = (
                <div
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                    item.danger
                      ? "text-destructive hover:bg-destructive/10"
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.shortcut && (
                    <kbd className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                      {item.shortcut}
                    </kbd>
                  )}
                </div>
              );

              if (item.href) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="w-full"
                >
                  {content}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
