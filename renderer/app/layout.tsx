"use client";

import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Timer,
  History,
  BarChart3,
  UserCircle,
  Settings,
  Music,
  Shield,
  TreePine,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Focus", icon: Timer },
  { href: "/history", label: "History", icon: History },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/profiles", label: "Profiles", icon: UserCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&family=Source+Code+Pro:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
          {/* Drag region for macOS title bar */}
          <div
            className="h-12 flex items-center gap-2 px-5 shrink-0"
            style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
          >
            <TreePine className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sidebar-foreground tracking-tight">
              Deepr Session
            </span>
          </div>

          <nav className="flex-1 px-3 py-2 space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-sidebar-border">
            <p className="text-xs text-muted-foreground text-center">
              v1.0.0
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">{children}</div>
        </main>
      </body>
    </html>
  );
}
