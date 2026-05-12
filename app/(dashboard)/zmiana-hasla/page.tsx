"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Eye, EyeOff } from "lucide-react";

export default function ChangePasswordPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/logowanie");
      return;
    }

    // Stay on page if password reset is required OR if user just completed it
    // Only redirect if session exists and explicitly not requiring reset AND not on this page intentionally
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Hasła nie są identyczne");
      return;
    }

    if (newPassword.length < 8) {
      setError("Hasło musi mieć co najmniej 8 znaków");
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setError("Hasło musi zawierać co najmniej jedną wielką literę");
      return;
    }

    const digitMatches = newPassword.match(/\d/g);
    if (!digitMatches || digitMatches.length < 2) {
      setError("Hasło musi zawierać co najmniej dwie cyfry");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      if (response.ok) {
        // Redirect to dashboard
        router.push("/");
      } else {
        const errorData = await response.json();
        setError(errorData?.error || "Wystąpił błąd podczas zmiany hasła");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setError("Wystąpił błąd podczas zmiany hasła");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-card p-8">
        <div className="text-center mb-8">
          <div className="bg-blue-50 p-3 rounded-2xl inline-block mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Zmień hasło</h1>
          <p className="text-gray-500 mt-2">
            Ze względów bezpieczeństwa musisz zmienić hasło przy pierwszym logowaniu.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="newPassword" className="text-gray-700 font-medium">
              Nowe hasło
            </Label>
            <div className="relative mt-2">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Min. 8 znaków, 1 wielka litera, 2 cyfry
            </p>
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
              Potwierdź nowe hasło
            </Label>
            <div className="relative mt-2">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-2xl h-12 shadow-soft hover:shadow-hover transition-all"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Lock className="w-5 h-5 mr-2" />
            )}
            Zmień hasło
          </Button>
        </form>
      </div>
    </div>
  );
}
