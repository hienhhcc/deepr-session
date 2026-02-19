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
  TreePine,
  Leaf,
  ListTodo,
  Music2,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Focus", icon: Timer },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/history", label: "History", icon: History },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/profiles", label: "Profiles", icon: UserCircle },
  { href: "/sounds", label: "Sounds", icon: Music2 },
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
        <aside className="w-60 border-r border-sidebar-border bg-sidebar flex flex-col relative noise-texture">
          {/* Drag region for macOS traffic lights */}
          <div
            className="h-10 shrink-0"
            style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
          />

          {/* App identity */}
          <div className="flex items-center gap-2.5 px-5 pb-4 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <TreePine className="h-4.5 w-4.5 text-primary" />
            </div>
            <span className="font-semibold text-sidebar-foreground tracking-tight text-[15px]">
              Deepr Session
            </span>
          </div>

          <nav className="flex-1 px-3 py-3 space-y-0.5">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 relative ${
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                  )}
                  <Icon className={`h-[18px] w-[18px] ${isActive ? "text-primary" : ""}`} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom decorative area */}
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground/40 mb-3">
              <Leaf className="h-3 w-3" />
              <span className="text-[10px] font-medium tracking-widest uppercase">
                Deep Work
              </span>
            </div>
            <div className="border-t border-sidebar-border pt-3">
              <p className="text-[10px] text-muted-foreground/50 text-center font-medium tracking-wide">
                v1.0.0
              </p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto relative noise-texture bg-nature-gradient">
          <div className="p-8 max-w-5xl">{children}</div>
        </main>
      </body>
    </html>
  );
}
