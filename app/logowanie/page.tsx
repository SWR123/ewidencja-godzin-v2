"use client";
// v2.1 - RK link added
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/strona-glowna",
      });

      console.log("Login result:", result);

      if (!result || result.error) {
        setError(result?.error || "Nieprawidłowy email lub hasło");
        setIsLoading(false);
        return;
      }

      // Successful login - result.url contains the redirect URL
      // or we can check session directly
      const session = await fetch("/api/auth/session").then(r => r.json());
      
      if (!session?.user) {
        setError("Nie udało się pobrać sesji");
        setIsLoading(false);
        return;
      }

      if (session.user.requirePasswordReset) {
        router.push("/zmiana-hasla");
      } else {
        router.push(result.url || "/strona-glowna");
      }
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      setError("Wystąpił błąd podczas logowania");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f6f8] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-card p-10">
          <div className="flex flex-col items-center justify-center mb-8">
            <Image 
              src="/logo-osir.png" 
              alt="OSiR Brodnica" 
              width={180} 
              height={90}
              priority
              className="rounded-xl"
            />
            <p className="text-[10px] text-gray-400 mt-3 text-center">
              Autor programu: Michał Brzeziński<br />
              all rights to the program reserved 2026
            </p>
          </div>
          
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Ewidencja Godzin</h1>
          <p className="text-center text-gray-500 mb-10">
            Zaloguj się do systemu
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-gray-700 font-medium">Adres email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="twoj@email.com"
                className="mt-2 rounded-2xl border-gray-200 h-12 px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700 font-medium">Hasło</Label>
              <div className="relative mt-2">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="rounded-2xl border-gray-200 h-12 px-4 pr-12 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-2xl h-12 text-base font-medium shadow-soft hover:shadow-hover transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? "Logowanie..." : "Zaloguj się"}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Nie masz konta?{" "}
              <Link
                href="/rejestracja"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Zarejestruj się
              </Link>
            </p>
          </div>

          {/* RK Link */}
          <div className="flex justify-center mt-8">
            <a
              href="https://kasa.osirbrodnica.site"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center text-gray-400 hover:text-gray-600 transition-colors"
              title="Kasa Kreator"
            >
              <div className="w-10 h-12 border-2 border-gray-200 rounded-2xl bg-gray-50 flex items-center justify-center text-xs font-bold hover:border-gray-400 hover:bg-gray-100 transition-all">
                RK
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
