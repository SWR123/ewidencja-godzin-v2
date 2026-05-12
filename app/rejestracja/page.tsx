"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, AlertCircle, CheckCircle } from "lucide-react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Hasła nie są identyczne");
      return;
    }

    if (password.length < 6) {
      setError("Hasło musi mieć co najmniej 6 znaków");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Wystąpił błąd podczas rejestracji");
        setIsLoading(false);
        return;
      }

      // Show success message - user needs activation
      setSuccess(true);
      setIsLoading(false);
    } catch (error) {
      setError("Wystąpił błąd podczas rejestracji");
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="flex items-center justify-center mb-8">
              <div className="bg-green-600 p-3 rounded-full">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-center mb-2 text-green-700">Konto utworzone!</h1>
            <p className="text-center text-gray-600 mb-4">
              Twoje konto zostało utworzone pomyślnie.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
              <p className="text-sm text-amber-800 text-center">
                <strong>Uwaga:</strong> Twoje konto wymaga aktywacji przez administratora. 
                Otrzymasz możliwość logowania po zatwierdzeniu konta.
              </p>
            </div>
            <Link href="/logowanie">
              <Button className="w-full">
                Przejdź do strony logowania
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-blue-600 p-3 rounded-full">
              <Clock className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-center mb-2">Ewidencja Godzin</h1>
          <p className="text-center text-gray-600 mb-8">
            Utwórz nowe konto
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Imię i nazwisko</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Jan Kowalski"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">Adres email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="twoj@email.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Hasło</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Rejestracja..." : "Zarejestruj się"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Masz już konto?{" "}
              <Link
                href="/logowanie"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Zaloguj się
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
