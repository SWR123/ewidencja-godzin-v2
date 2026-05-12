"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useSidebar } from "@/components/sidebar-provider";
import {
  Home,
  FileText,
  Archive,
  Users,
  Database,
  ScrollText,
  LogOut,
  Settings,
  X,
} from "lucide-react";

const ADMIN_EMAIL = "admin@ewidencja.pl";

export function ModernSidebar() {
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  const navItems = [
    { icon: Home, label: "Strona główna", href: "/strona-glowna" },
    { icon: FileText, label: "Rekordy", href: "/rekordy" },
    { icon: Archive, label: "Archiwum", href: "/archiwum" },
    { icon: Users, label: "Użytkownicy", href: "/uzytkownicy" },
    { icon: Database, label: "Kopie zapasowe", href: "/kopie-zapasowe" },
    ...(isAdmin ? [{ icon: ScrollText, label: "Logi", href: "/logi" }] : []),
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Close Button & Logo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-card">
          <span className="text-white font-bold text-lg">E</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Zamknij menu"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 text-blue-600 shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-gray-100 p-3 space-y-2">
        <Link
          href="/ustawienia"
          onClick={() => setIsSidebarOpen(false)}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">Ustawienia</span>
        </Link>
        <button
          onClick={() => {
            setIsSidebarOpen(false);
            signOut({ callbackUrl: "/logowanie" });
          }}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">Wyloguj</span>
        </button>
      </div>
    </aside>
  );
}
