"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, BarChart3, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      id: "create",
      label: "Create Ads",
      href: "/dashboard/create",
      icon: Plus,
    },
    {
      id: "analytics",
      label: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart3,
    },
  ];

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo section */}
      <div className="flex items-center gap-2 border-b border-border p-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="text-xl font-semibold text-foreground">studio</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
