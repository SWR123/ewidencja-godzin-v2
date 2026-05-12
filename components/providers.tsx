"use client";

import { SessionProvider, useSession, signOut } from "next-auth/react";
import { ThemeProvider } from "./theme-provider";
import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

function ActivityTracker({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession() || {};
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isAuthPage = pathname === "/logowanie" || pathname === "/rejestracja";

  const handleLogout = useCallback(async () => {
    if (session && !isAuthPage) {
      await signOut({ callbackUrl: "/logowanie" });
    }
  }, [session, isAuthPage]);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (session && !isAuthPage) {
      timeoutRef.current = setTimeout(handleLogout, INACTIVITY_TIMEOUT);
    }
  }, [session, isAuthPage, handleLogout]);

  useEffect(() => {
    if (status !== "authenticated" || isAuthPage) {
      return;
    }

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];

    const handleActivity = () => {
      resetTimer();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    resetTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [status, isAuthPage, resetTimer]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <ActivityTracker>{children}</ActivityTracker>
      </ThemeProvider>
    </SessionProvider>
  );
}
