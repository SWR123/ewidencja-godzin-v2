"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, LogOut, Menu } from "lucide-react";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { useSidebar } from "../components/sidebar-provider";

const ADMIN_EMAIL = "admin@ewidencja.pl";

export function DashboardHeader() {
  const { data: session } = useSession() || {};
  const { setIsSidebarOpen } = useSidebar();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            {/* Hamburger Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              title="Otwórz menu"
              className="mr-2"
            >
              <Menu className="w-5 h-5" />
            </Button>

            <Link href="/strona-glowna" className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900">
                Ewidencja Godzin
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-gray-900">
                {session?.user?.name ?? "Użytkownik"}
              </span>
              <span className="text-xs text-gray-500">
                {session?.user?.email ?? ""}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: "/logowanie" })}
              title="Wyloguj"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
